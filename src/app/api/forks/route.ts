/**
 * Forks API — Route Handler
 *
 * Module: FK (Forking)
 * Endpoints:
 *   GET  /api/forks       — Get fork tree for a post — RF-FK-03
 *   POST /api/forks       — Fork a post — RF-FK-01
 *
 * TODO: Implement with Supabase + materialized path.
 * Assigned to: [TEAM MEMBER]
 */
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { message: "GET /api/forks — Not implemented yet", tree: null },
    { status: 200 }
  );
}

export async function POST() {
  return NextResponse.json(
    { message: "POST /api/forks — Not implemented yet" },
    { status: 501 }
  );
}
