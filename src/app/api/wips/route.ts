/**
 * WIPs API — Route Handler
 *
 * Module: WP (WIPs)
 * Endpoints:
 *   GET  /api/wips       — List WIPs (paginated)
 *   POST /api/wips       — Create a new WIP — RF-WP-01
 *
 * TODO: Implement with Supabase queries.
 * Assigned to: [TEAM MEMBER]
 */
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { message: "GET /api/wips — Not implemented yet", items: [], nextCursor: null },
    { status: 200 }
  );
}

export async function POST() {
  return NextResponse.json(
    { message: "POST /api/wips — Not implemented yet" },
    { status: 501 }
  );
}
