import { NextResponse } from "next/server";
import { dbAvailable, getPool } from "@/lib/db";
import { supabaseConfigured } from "@/lib/supabase/client";

export const runtime = "nodejs";

export async function GET() {
  const checks: Record<string, "ok" | "skipped" | "error"> = {
    database: "skipped",
    supabase: supabaseConfigured() ? "ok" : "skipped",
  };

  if (dbAvailable()) {
    try {
      const pool = getPool();
      if (pool) {
        await pool.query("SELECT 1");
        checks.database = "ok";
      }
    } catch {
      checks.database = "error";
    }
  }

  const healthy = checks.database !== "error";
  return NextResponse.json(
    {
      ok: healthy,
      service: "vibe-night",
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 }
  );
}
