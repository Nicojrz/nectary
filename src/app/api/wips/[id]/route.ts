import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateWipSchema } from "@/lib/wip-domain";

async function findWip(id: string) {
  const supabase = await createClient();
  return supabase
    .from("wips")
    .select("id,author_id,title,description,current_block,status,categories,tags,comment_count,fork_count,post_mortem_id,is_draft,created_at,updated_at")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: wip, error } = await findWip(id);

  if (error) {
    console.error(`GET /api/wips/${id}`, error);
    return NextResponse.json({ error: "No fue posible cargar el WIP" }, { status: 500 });
  }
  if (!wip) return NextResponse.json({ error: "WIP no encontrado" }, { status: 404 });

  const [{ data: author }, versionResult] = await Promise.all([
    supabase.from("profiles").select("id,name,avatar_url,level").eq("id", wip.author_id).maybeSingle(),
    supabase
      .from("wip_versions")
      .select("version,title,description,current_block,categories,created_at")
      .eq("wip_id", id)
      .order("version", { ascending: false }),
  ]);

  const versions = versionResult.error
    ? [{ version: 1, title: wip.title, description: wip.description, current_block: wip.current_block, categories: wip.categories, created_at: wip.created_at }]
    : versionResult.data ?? [];
  const version = versions[0]?.version ?? 1;

  return NextResponse.json({ item: { ...wip, version, author }, versions });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "El cuerpo debe ser JSON válido" }, { status: 400 });
  }
  const parsed = updateWipSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { data: current, error: findError } = await findWip(id);
  if (findError) return NextResponse.json({ error: "No fue posible consultar el WIP" }, { status: 500 });
  if (!current) return NextResponse.json({ error: "WIP no encontrado" }, { status: 404 });
  if (current.author_id !== authData.user.id) {
    return NextResponse.json({ error: "Solo el autor puede editar este WIP" }, { status: 403 });
  }

  const values = parsed.data;
  const update: Record<string, unknown> = {};
  if (values.title !== undefined) update.title = values.title;
  if (values.content !== undefined) update.description = values.content;
  if (values.category !== undefined) update.categories = [values.category];
  if (values.currentBlock !== undefined) update.current_block = values.currentBlock || null;
  if (values.status !== undefined) update.status = values.status;
  if (values.isDraft !== undefined) update.is_draft = values.isDraft;

  const { data, error } = await supabase
    .from("wips")
    .update(update)
    .eq("id", id)
    .select("id,title,description,current_block,status,categories,is_draft,updated_at")
    .single();

  if (error) {
    console.error(`PATCH /api/wips/${id}`, error);
    return NextResponse.json({ error: "No fue posible actualizar el WIP" }, { status: 500 });
  }

  const { data: latestVersion } = await supabase
    .from("wip_versions")
    .select("version")
    .eq("wip_id", id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const justResolved = current.status !== "resolved" && data.status === "resolved";
  return NextResponse.json({ item: { ...data, version: latestVersion?.version ?? 1 }, suggestPostMortem: justResolved });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }

  const { data: current } = await findWip(id);
  if (!current) return NextResponse.json({ error: "WIP no encontrado" }, { status: 404 });
  if (current.author_id !== authData.user.id) {
    return NextResponse.json({ error: "Solo el autor puede eliminar este WIP" }, { status: 403 });
  }

  const { error } = await supabase
    .from("wips")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    console.error(`DELETE /api/wips/${id}`, error);
    return NextResponse.json({ error: "No fue posible eliminar el WIP" }, { status: 500 });
  }
  return new NextResponse(null, { status: 204 });
}
