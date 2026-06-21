import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createWipCommentSchema } from "@/lib/wip-domain";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: wip } = await supabase
    .from("wips")
    .select("id")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!wip) return NextResponse.json({ error: "WIP no encontrado" }, { status: 404 });

  const modernComments = await supabase
    .from("wip_comments")
    .select("id,author_id,content,wip_version,created_at")
    .eq("wip_id", id)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  const commentsResult = modernComments.error
    ? await supabase
        .from("wip_comments")
        .select("id,author_id,content,created_at")
        .eq("wip_id", id)
        .is("deleted_at", null)
        .order("created_at", { ascending: true })
    : modernComments;
  if (commentsResult.error) {
    console.error(`GET /api/wips/${id}/comments`, commentsResult.error);
    return NextResponse.json({ error: "No fue posible cargar los comentarios" }, { status: 500 });
  }

  const comments = (commentsResult.data ?? []).map((comment) => ({
    ...comment,
    wip_version: "wip_version" in comment ? Number(comment.wip_version) : 1,
  }));

  const authorIds = [...new Set(comments.map((comment) => comment.author_id))];
  const { data: authors } = authorIds.length
    ? await supabase.from("profiles").select("id,name,avatar_url,level").in("id", authorIds)
    : { data: [] };
  const authorMap = new Map((authors ?? []).map((author) => [author.id, author]));

  return NextResponse.json({
    items: comments.map((comment) => ({
      ...comment,
      author: authorMap.get(comment.author_id) ?? null,
    })),
  });
}

export async function POST(
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
  const parsed = createWipCommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Comentario inválido" }, { status: 422 });
  }

  const { data: wip, error: wipError } = await supabase
    .from("wips")
    .select("id,author_id")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (wipError) return NextResponse.json({ error: "No fue posible consultar el WIP" }, { status: 500 });
  if (!wip) return NextResponse.json({ error: "WIP no encontrado" }, { status: 404 });
  if (wip.author_id === authData.user.id) {
    return NextResponse.json({ error: "No puedes comentar tu propio WIP" }, { status: 403 });
  }

  const version = parsed.data.version ?? 1;
  const versionResult = await supabase
    .from("wip_versions")
    .select("version")
    .eq("wip_id", id)
    .eq("version", version)
    .maybeSingle();
  if (!versionResult.error && !versionResult.data) {
    return NextResponse.json({ error: "La versión seleccionada no existe" }, { status: 422 });
  }

  const commentValues = {
    wip_id: id,
    author_id: authData.user.id,
    content: parsed.data.content,
  };
  const result = versionResult.error
    ? await supabase
        .from("wip_comments")
        .insert(commentValues)
        .select("id,author_id,content,created_at")
        .single()
    : await supabase
        .from("wip_comments")
        .insert({ ...commentValues, wip_version: version })
        .select("id,author_id,content,wip_version,created_at")
        .single();
  const { data, error } = result;
  if (error) {
    console.error(`POST /api/wips/${id}/comments`, error);
    return NextResponse.json({ error: "No fue posible guardar el comentario" }, { status: 500 });
  }

  return NextResponse.json({ item: { ...data, wip_version: "wip_version" in data ? data.wip_version : 1 } }, { status: 201 });
}
