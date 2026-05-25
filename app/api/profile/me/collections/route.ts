import { NextResponse } from "next/server";
import { dbAvailable, ensureTables, getPool } from "@/lib/db";
import { buildCollectionsSnapshot, fetchProfileMe } from "@/lib/profile/queries";
import { getCurrentUserFromRequest } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!dbAvailable()) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }
  try {
    await ensureTables();
  } catch {
    return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  }

  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pool = getPool()!;
  const profile = await fetchProfileMe(pool, user.id);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  const collections = await buildCollectionsSnapshot(pool, user.id, profile);
  return NextResponse.json({ collections });
}
