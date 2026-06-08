/**
 * Single WIP API — Route Handler
 *
 * Endpoints:
 *   GET    /api/wips/[id]  — Get WIP by ID
 *   PATCH  /api/wips/[id]  — Update WIP (status change — RF-WP-03)
 *   DELETE /api/wips/[id]  — Delete WIP
 */
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json(
    { message: `GET /api/wips/${id} — Not implemented yet` },
    { status: 501 }
  );
}

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json(
    { message: `PATCH /api/wips/${id} — Not implemented yet` },
    { status: 501 }
  );
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json(
    { message: `DELETE /api/wips/${id} — Not implemented yet` },
    { status: 501 }
  );
}
