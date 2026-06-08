/**
 * Sparks API — Route Handler
 *
 * Module: SP (Sparks)
 * Endpoints:
 *   GET  /api/sparks       — List sparks (paginated) — RF-FD-01
 *   POST /api/sparks       — Create a new spark — RF-SP-01
 *
 * TODO: Implement with Supabase queries.
 * Assigned to: [TEAM MEMBER]
 */
import { NextResponse } from "next/server";

export async function GET() {
  // TODO: Fetch paginated sparks from Supabase
  return NextResponse.json(
    { message: "GET /api/sparks — Not implemented yet", items: [], nextCursor: null },
    { status: 200 }
  );
}

export async function POST() {
  // TODO: Create spark in Supabase
  return NextResponse.json(
    { message: "POST /api/sparks — Not implemented yet" },
    { status: 501 }
  );
}
