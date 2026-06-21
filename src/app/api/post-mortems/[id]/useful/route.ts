import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function context(id: string) {
  const supabase = await createClient();
  const [{ data: authData, error: authError }, { data: postMortem }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("post_mortems").select("id,author_id,unblocked_count").eq("id", id).is("deleted_at", null).maybeSingle(),
  ]);
  return { supabase, user: authData.user, authError, postMortem };
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { supabase, user, authError, postMortem } = await context(id);
  if (authError || !user) return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  if (!postMortem) return NextResponse.json({ error: "Post-Mortem no encontrado" }, { status: 404 });
  if (postMortem.author_id === user.id) {
    return NextResponse.json({ error: "No puedes marcar como útil tu propio Post-Mortem" }, { status: 403 });
  }

  const { error } = await supabase.from("reactions").insert({
    user_id: user.id,
    target_id: id,
    target_type: "post-mortem",
    emoji: "🔥",
  });
  if (error && error.code !== "23505") {
    console.error(`POST /api/post-mortems/${id}/useful`, error);
    return NextResponse.json({ error: "No fue posible registrar la utilidad" }, { status: 500 });
  }

  const { data: updated } = await supabase.from("post_mortems").select("unblocked_count").eq("id", id).single();
  revalidatePath(`/post-mortem/${id}`);
  return NextResponse.json({ markedUseful: true, count: updated?.unblocked_count ?? postMortem.unblocked_count });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { supabase, user, authError, postMortem } = await context(id);
  if (authError || !user) return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  if (!postMortem) return NextResponse.json({ error: "Post-Mortem no encontrado" }, { status: 404 });

  const { error } = await supabase
    .from("reactions")
    .delete()
    .eq("user_id", user.id)
    .eq("target_id", id)
    .eq("target_type", "post-mortem")
    .eq("emoji", "🔥");
  if (error) return NextResponse.json({ error: "No fue posible quitar la marca" }, { status: 500 });

  const { data: updated } = await supabase.from("post_mortems").select("unblocked_count").eq("id", id).single();
  revalidatePath(`/post-mortem/${id}`);
  return NextResponse.json({ markedUseful: false, count: updated?.unblocked_count ?? postMortem.unblocked_count });
}
