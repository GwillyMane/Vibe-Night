import { NextResponse } from "next/server";
import { registerUser } from "@/lib/auth";
import { dbAvailable, ensureTables, getPool } from "@/lib/db";
import { clientIp, rateLimitAllow } from "@/lib/rateLimit";
import { createSessionForUser, setSessionCookieOnResponse } from "@/lib/session";
export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!dbAvailable()) {
    return NextResponse.json({ error: "Database is not configured. Set DATABASE_URL to enable accounts." }, { status: 503 });
  }
  try {
    await ensureTables();
  } catch {
    return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  }

  const pool = getPool()!;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const ip = clientIp(request);
  if (!rateLimitAllow(`auth:register:ip:${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: "Too many registration attempts. Try again shortly." }, { status: 429 });
  }

  const b = body as { username?: string; password?: string };  if (!b.username || !b.password) {
    return NextResponse.json({ error: "username and password are required." }, { status: 400 });
  }

  const result = await registerUser(pool, {
    username: b.username,
    password: b.password,
  });
  if ("error" in result) {
    const status = result.code === "duplicate" ? 409 : result.code === "validation" ? 400 : 500;
    return NextResponse.json({ error: result.error }, { status });
  }

  const { rawToken } = await createSessionForUser(pool, result.user.id);
  const res = NextResponse.json({ user: result.user });
  setSessionCookieOnResponse(res, rawToken);
  return res;
}
