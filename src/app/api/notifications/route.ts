/**
 * Notifications API — Route Handler
 *
 * Module: Notifications (Cross-cutting)
 * Endpoints:
 *   GET   /api/notifications       — Get user notifications
 *   PATCH /api/notifications       — Mark notifications as read
 *
 * TODO: Implement with Supabase (in-app only).
 * Assigned to: [TEAM MEMBER]
 */
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { message: "GET /api/notifications — Not implemented yet", items: [] },
    { status: 200 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { message: "PATCH /api/notifications — Not implemented yet" },
    { status: 501 }
  );
}
