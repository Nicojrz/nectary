import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createForkSchema, forkablePostTypeSchema } from "@/lib/fork-domain";

interface ForkRow {
  fork_id: string | null;
  post_id: string;
  post_type: "spark" | "wip";
  parent_post_id: string | null;
  source_version: number;
  motivation: string | null;
  author_name: string;
  title: string | null;
  category: string | null;
  original_deleted: boolean;
  depth: number;
  created_at: string;
}

interface ForkNode {
  forkId: string | null;
  postId: string;
  postType: "spark" | "wip";
  parentPostId: string | null;
  sourceVersion: number;
  motivation: string | null;
  authorName: string;
  title: string;
  category: string | null;
  originalDeleted: boolean;
  depth: number;
  createdAt: string;
  children: ForkNode[];
}

function toNode(row: ForkRow): ForkNode {
  return {
    forkId: row.fork_id,
    postId: row.post_id,
    postType: row.post_type,
    parentPostId: row.parent_post_id,
    sourceVersion: row.source_version,
    motivation: row.motivation,
    authorName: row.author_name,
    title: row.original_deleted ? "[Contenido eliminado]" : row.title || "Texto sin título",
    category: row.category,
    originalDeleted: row.original_deleted,
    depth: row.depth,
    createdAt: row.created_at,
    children: [],
  };
}

function buildTree(rows: ForkRow[]) {
  const nodes = new Map(rows.map((row) => [row.post_id, toNode(row)]));
  let root: ForkNode | null = null;

  for (const node of nodes.values()) {
    if (!node.parentPostId || !nodes.has(node.parentPostId)) {
      root ??= node;
    } else {
      nodes.get(node.parentPostId)?.children.push(node);
    }
  }
  return root;
}

export async function GET(request: NextRequest) {
  const sourceId = request.nextUrl.searchParams.get("sourceId");
  const sourceType = request.nextUrl.searchParams.get("sourceType");

  if (!sourceId || !zUuid(sourceId) || !forkablePostTypeSchema.safeParse(sourceType).success) {
    return NextResponse.json(
      { error: "Debes indicar un sourceId y sourceType válidos" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_fork_tree", {
    p_post_id: sourceId,
    p_post_type: sourceType,
  });

  if (error) {
    console.error("GET /api/forks", error);
    return NextResponse.json({ error: "No fue posible cargar la trazabilidad" }, { status: 500 });
  }

  const rows = (data ?? []) as ForkRow[];
  const current = rows.find((row) => row.post_id === sourceId);
  const parent = current?.parent_post_id
    ? rows.find((row) => row.post_id === current.parent_post_id)
    : null;

  return NextResponse.json({
    tree: buildTree(rows),
    items: rows.map(toNode),
    attribution: current?.fork_id
      ? {
          sourceId: current.parent_post_id,
          sourceType: parent?.post_type ?? sourceType,
          sourceVersion: current.source_version,
          authorName: parent?.author_name ?? "Autor desconocido",
          title: parent?.original_deleted ? "[Contenido eliminado]" : parent?.title ?? "Texto de origen",
          motivation: current.motivation,
        }
      : null,
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

  const parsed = createForkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const input = parsed.data;
  const { data, error } = await supabase.rpc("create_fork", {
    p_source_id: input.sourceId,
    p_source_type: input.sourceType,
    p_source_version: input.sourceVersion,
    p_motivation: input.motivation,
    p_result: input.result,
  });

  if (error) {
    console.error("POST /api/forks", error);
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Ya creaste un fork de esta versión" },
        { status: 409 },
      );
    }
    if (["22023", "P0002"].includes(error.code ?? "")) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    return NextResponse.json({ error: "No fue posible crear el fork" }, { status: 500 });
  }

  return NextResponse.json({ item: data }, { status: 201 });
}

function zUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
