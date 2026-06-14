/**
 * Likes API — Route Handler
 *
 * Module: SP/WP/PM (Cross-cutting)
 * Endpoints:
 *   POST   /api/likes  — Add like — RF-SP-03
 *   DELETE /api/likes  — Remove like
 *
 * TODO: Implement with Supabase.
 * Assigned to: [TEAM MEMBER]
 */
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { message: "POST /api/likes — Not implemented yet" },
    { status: 501 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { message: "DELETE /api/likes — Not implemented yet" },
    { status: 501 }
  );
}
