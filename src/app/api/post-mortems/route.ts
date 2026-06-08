/**
 * Post-Mortems API — Route Handler
 *
 * Module: PM (Post-Mortems)
 * Endpoints:
 *   GET  /api/post-mortems       — List/search post-mortems — RF-PM-03
 *   POST /api/post-mortems       — Create post-mortem — RF-PM-01
 *
 * TODO: Implement with Supabase queries + full-text search.
 * Assigned to: [TEAM MEMBER]
 */
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { message: "GET /api/post-mortems — Not implemented yet", items: [], nextCursor: null },
    { status: 200 }
  );
}

export async function POST() {
  return NextResponse.json(
    { message: "POST /api/post-mortems — Not implemented yet" },
    { status: 501 }
  );
}
