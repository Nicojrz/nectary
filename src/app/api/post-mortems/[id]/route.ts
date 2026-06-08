/**
 * Single Post-Mortem API — Route Handler
 *
 * Endpoints:
 *   GET    /api/post-mortems/[id]  — Get post-mortem by ID
 *   PATCH  /api/post-mortems/[id]  — Update (with version tracking — RNF-PM-02)
 *   DELETE /api/post-mortems/[id]  — Delete post-mortem
 */
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json(
    { message: `GET /api/post-mortems/${id} — Not implemented yet` },
    { status: 501 }
  );
}

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json(
    { message: `PATCH /api/post-mortems/${id} — Not implemented yet` },
    { status: 501 }
  );
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json(
    { message: `DELETE /api/post-mortems/${id} — Not implemented yet` },
    { status: 501 }
  );
}
