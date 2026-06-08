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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json(
    { message: `GET /api/sparks/${id} — Not implemented yet` },
    { status: 501 }
  );
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
