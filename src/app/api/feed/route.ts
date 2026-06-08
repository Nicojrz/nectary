/**
 * Feed API — Route Handler
 *
 * Module: FD (Feed)
 * Endpoints:
 *   GET /api/feed — Unified paginated feed — RF-FD-01
 *     Query params: ?discipline=&type=&cursor=&limit=&state=
 *
 * TODO: Implement with Supabase + creative state adaptation (RF-FD-04).
 * Assigned to: [TEAM MEMBER]
 */
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      message: "GET /api/feed — Not implemented yet",
      items: [],
      nextCursor: null,
      hasMore: false,
    },
    { status: 200 }
  );
}
