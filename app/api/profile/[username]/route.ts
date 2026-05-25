import { NextResponse } from "next/server";
import { dbAvailable, ensureTables, getPool } from "@/lib/db";
import { fetchPublicProfile } from "@/lib/profile/queries";
import { getCurrentUserFromRequest } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(request: Request, ctx: { params: Promise<{ username: string }> }) {
  if (!dbAvailable()) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }
  try {
    await ensureTables();
  } catch {
    return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  }

  const { username } = await ctx.params;
  if (!username?.trim()) {
    return NextResponse.json({ error: "Username required." }, { status: 400 });
  }

  const viewer = await getCurrentUserFromRequest(request);
  const profile = await fetchPublicProfile(getPool()!, username, viewer?.id ?? null);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  return NextResponse.json({ profile });
}
