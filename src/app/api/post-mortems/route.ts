import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createPostMortemSchema } from "@/lib/post-mortem-domain";
import { literaryCategorySchema } from "@/lib/wip-domain";

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const q = request.nextUrl.searchParams.get("q")?.trim();
  const category = request.nextUrl.searchParams.get("category");
  const cursor = request.nextUrl.searchParams.get("cursor");
  const requestedLimit = Number(request.nextUrl.searchParams.get("limit") ?? PAGE_SIZE);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(Math.trunc(requestedLimit), 1), 50)
    : PAGE_SIZE;

  if (category && !literaryCategorySchema.safeParse(category).success) {
    return NextResponse.json({ error: "Categoría inválida" }, { status: 400 });
  }
  if (cursor && Number.isNaN(Date.parse(cursor))) {
    return NextResponse.json({ error: "Cursor inválido" }, { status: 400 });
  }

  let query = supabase
    .from("post_mortems")
    .select("id,author_id,title,context,failed_attempts,solution,lessons_learned,categories,tags,wip_origin_id,unblocked_count,version,created_at,updated_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (q) query = query.textSearch("search_vector", q, { config: "spanish", type: "websearch" });
  if (category) query = query.contains("categories", [category]);
  if (cursor) query = query.lt("created_at", cursor);

  const { data, error } = await query;
  if (error) {
    console.error("GET /api/post-mortems", error);
    return NextResponse.json({ error: "No fue posible buscar Post-Mortems" }, { status: 500 });
  }

  const rows = data ?? [];
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return NextResponse.json({
    items,
    hasMore,
    nextCursor: hasMore ? items.at(-1)?.created_at ?? null : null,
  });
}

export async function POST(request: Request) {
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
  const parsed = createPostMortemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const values = parsed.data;
  if (values.wipOriginId) {
    const { data: wip } = await supabase
      .from("wips")
      .select("id,author_id,status,post_mortem_id")
      .eq("id", values.wipOriginId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!wip) return NextResponse.json({ error: "WIP de origen no encontrado" }, { status: 404 });
    if (wip.author_id !== authData.user.id) {
      return NextResponse.json({ error: "Solo puedes vincular un WIP propio" }, { status: 403 });
    }
    if (wip.post_mortem_id) {
      return NextResponse.json({ error: "Este WIP ya tiene un Post-Mortem" }, { status: 409 });
    }
  }

  const { data, error } = await supabase
    .from("post_mortems")
    .insert({
      author_id: authData.user.id,
      title: values.title,
      context: values.context,
      failed_attempts: values.failedAttempts,
      solution: values.solution,
      lessons_learned: values.lessonsLearned,
      categories: [values.category],
      wip_origin_id: values.wipOriginId ?? null,
    })
    .select("id,title,wip_origin_id,version,created_at")
    .single();

  if (error) {
    console.error("POST /api/post-mortems", error);
    const conflict = error.code === "23505";
    return NextResponse.json(
      { error: conflict ? "Este WIP ya tiene un Post-Mortem" : "No fue posible publicar el Post-Mortem" },
      { status: conflict ? 409 : 500 },
    );
  }

  if (values.wipOriginId) {
    const { error: linkError } = await supabase
      .from("wips")
      .update({ status: "resolved", post_mortem_id: data.id })
      .eq("id", values.wipOriginId)
      .eq("author_id", authData.user.id);
    if (linkError) {
      console.error("POST /api/post-mortems: WIP link", linkError);
      await supabase.from("post_mortems").delete().eq("id", data.id);
      return NextResponse.json({ error: "No fue posible vincular el Post-Mortem con el WIP" }, { status: 500 });
    }
  }

  revalidatePath(`/post-mortem/${data.id}`);
  revalidatePath("/feed");
  return NextResponse.json({ item: data }, { status: 201 });
}
