/**
 * Reactions API — Route Handler
 *
 * Module: SP/WP/PM (Cross-cutting)
 * Endpoints:
 *   POST   /api/reactions  — Add reaction — RF-SP-03
 *   DELETE /api/reactions  — Remove reaction
 *
 * TODO: Implement with Supabase.
 * Assigned to: [TEAM MEMBER]
 */
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { message: "POST /api/reactions — Not implemented yet" },
    { status: 501 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { message: "DELETE /api/reactions — Not implemented yet" },
    { status: 501 }
  );
}
