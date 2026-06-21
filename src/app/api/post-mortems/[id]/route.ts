import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { updatePostMortemSchema } from "@/lib/post-mortem-domain";

async function findPostMortem(id: string) {
  const supabase = await createClient();
  return supabase
    .from("post_mortems")
    .select("id,author_id,title,context,failed_attempts,solution,lessons_learned,categories,tags,wip_origin_id,unblocked_count,version,created_at,updated_at")
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
  const { data: postMortem, error } = await findPostMortem(id);
  if (error) return NextResponse.json({ error: "No fue posible cargar el Post-Mortem" }, { status: 500 });
  if (!postMortem) return NextResponse.json({ error: "Post-Mortem no encontrado" }, { status: 404 });

  const [{ data: author }, { data: wip }, { data: versions }, { data: authData }] = await Promise.all([
    supabase.from("profiles").select("id,name,avatar_url,level").eq("id", postMortem.author_id).maybeSingle(),
    postMortem.wip_origin_id
      ? supabase.from("wips").select("id,title,status").eq("id", postMortem.wip_origin_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("post_mortem_versions")
      .select("version,title,context,failed_attempts,solution,lessons_learned,created_at")
      .eq("post_mortem_id", id)
      .order("version", { ascending: false }),
    supabase.auth.getUser(),
  ]);

  let markedUseful = false;
  if (authData.user) {
    const { data: reaction } = await supabase
      .from("reactions")
      .select("id")
      .eq("user_id", authData.user.id)
      .eq("target_id", id)
      .eq("target_type", "post-mortem")
      .eq("emoji", "🔥")
      .maybeSingle();
    markedUseful = Boolean(reaction);
  }

  return NextResponse.json({ item: { ...postMortem, author, wip }, versions: versions ?? [], markedUseful });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "El cuerpo debe ser JSON válido" }, { status: 400 });
  }
  const parsed = updatePostMortemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 422 });
  }

  const { data: current } = await findPostMortem(id);
  if (!current) return NextResponse.json({ error: "Post-Mortem no encontrado" }, { status: 404 });
  if (current.author_id !== authData.user.id) {
    return NextResponse.json({ error: "Solo el autor puede editar este Post-Mortem" }, { status: 403 });
  }

  const values = parsed.data;
  const update: Record<string, unknown> = {};
  if (values.title !== undefined) update.title = values.title;
  if (values.context !== undefined) update.context = values.context;
  if (values.failedAttempts !== undefined) update.failed_attempts = values.failedAttempts;
  if (values.solution !== undefined) update.solution = values.solution;
  if (values.lessonsLearned !== undefined) update.lessons_learned = values.lessonsLearned;
  if (values.category !== undefined) update.categories = [values.category];

  const { data, error } = await supabase
    .from("post_mortems")
    .update(update)
    .eq("id", id)
    .select("id,title,version,updated_at")
    .single();
  if (error) {
    console.error(`PATCH /api/post-mortems/${id}`, error);
    return NextResponse.json({ error: "No fue posible actualizar el Post-Mortem" }, { status: 500 });
  }

  revalidatePath(`/post-mortem/${id}`);
  return NextResponse.json({ item: data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });

  const { data: current } = await findPostMortem(id);
  if (!current) return NextResponse.json({ error: "Post-Mortem no encontrado" }, { status: 404 });
  if (current.author_id !== authData.user.id) {
    return NextResponse.json({ error: "Solo el autor puede eliminar este Post-Mortem" }, { status: 403 });
  }

  const { error } = await supabase
    .from("post_mortems")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return NextResponse.json({ error: "No fue posible eliminar el Post-Mortem" }, { status: 500 });

  if (current.wip_origin_id) {
    await supabase.from("wips").update({ post_mortem_id: null }).eq("id", current.wip_origin_id);
  }
  revalidatePath(`/post-mortem/${id}`);
  revalidatePath("/feed");
  return new NextResponse(null, { status: 204 });
}
