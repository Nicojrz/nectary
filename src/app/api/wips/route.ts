import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createWipSchema,
  literaryCategorySchema,
  wipStatusSchema,
} from "@/lib/wip-domain";

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const category = request.nextUrl.searchParams.get("category");
  const status = request.nextUrl.searchParams.get("status");
  const cursor = request.nextUrl.searchParams.get("cursor");
  const mine = request.nextUrl.searchParams.get("mine") === "true";
  const requestedLimit = Number(request.nextUrl.searchParams.get("limit") ?? PAGE_SIZE);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(Math.trunc(requestedLimit), 1), 50)
    : PAGE_SIZE;

  if (category && !literaryCategorySchema.safeParse(category).success) {
    return NextResponse.json({ error: "Categoría inválida" }, { status: 400 });
  }
  if (status && !wipStatusSchema.safeParse(status).success) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }
  if (cursor && Number.isNaN(Date.parse(cursor))) {
    return NextResponse.json({ error: "Cursor inválido" }, { status: 400 });
  }

  let query = supabase
    .from("wips")
    .select("id,author_id,title,description,current_block,status,categories,tags,comment_count,fork_count,post_mortem_id,is_draft,created_at,updated_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (mine) {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
    }
    query = query.eq("author_id", authData.user.id);
  }
  if (category) query = query.contains("categories", [category]);
  if (status) query = query.eq("status", status);
  if (cursor) query = query.lt("created_at", cursor);

  const { data, error } = await query;
  if (error) {
    console.error("GET /api/wips", error);
    return NextResponse.json({ error: "No fue posible cargar los WIPs" }, { status: 500 });
  }

  const rows = data ?? [];
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? items.at(-1)?.created_at ?? null : null;

  return NextResponse.json({ items, nextCursor, hasMore });
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

  const parsed = createWipSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { title, content, category, currentBlock, status, isDraft } = parsed.data;
  const { data, error } = await supabase
    .from("wips")
    .insert({
      author_id: authData.user.id,
      title,
      description: content,
      current_block: currentBlock || null,
      status,
      categories: [category],
      is_draft: isDraft,
    })
    .select("id,title,status,categories,is_draft,created_at")
    .single();

  if (error) {
    console.error("POST /api/wips", error);
    return NextResponse.json({ error: "No fue posible guardar el WIP" }, { status: 500 });
  }

  return NextResponse.json({ item: { ...data, version: 1 } }, { status: 201 });
}
