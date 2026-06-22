/**
 * Single Spark API — Route Handler
 *
 * Endpoints:
 *   GET    /api/sparks/[id]  — Get spark by ID — RF-SP-04
 *   PATCH  /api/sparks/[id]  — Update spark
 *   DELETE /api/sparks/[id]  — Delete spark
 *
 * TODO: Implement with Supabase queries.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sparks")
    .select("id,author_id,content,categories,tags,fork_count,created_at,author:profiles(id,name,avatar_url,level)")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) {
    console.error(`GET /api/sparks/${id}`, error);
    return NextResponse.json({ error: "No fue posible cargar el Spark" }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Spark no encontrado" }, { status: 404 });
  return NextResponse.json({ item: data });
}

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json(
    { message: `PATCH /api/sparks/${id} — Not implemented yet` },
    { status: 501 }
  );
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json(
    { message: `DELETE /api/sparks/${id} — Not implemented yet` },
    { status: 501 }
  );
}
