/**
 * WIP Comments API — Route Handler
 *
 * Endpoints:
 *   GET  /api/wips/[id]/comments  — List comments — RF-WP-02
 *   POST /api/wips/[id]/comments  — Add comment with optional code block
 *
 * TODO: Implement with Supabase queries.
 * Assigned to: [TEAM MEMBER]
 */
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json(
    { message: `GET /api/wips/${id}/comments — Not implemented yet`, items: [] },
    { status: 200 }
  );
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json(
    { message: `POST /api/wips/${id}/comments — Not implemented yet` },
    { status: 501 }
  );
}
