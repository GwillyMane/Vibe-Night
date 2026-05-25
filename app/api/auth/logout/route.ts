import { NextResponse } from "next/server";
import { dbAvailable, ensureTables, getPool } from "@/lib/db";
import { clearSessionCookieOnResponse, deleteSessionByRawToken, readSessionTokenFromRequest } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const res = NextResponse.json({ ok: true });
  if (!dbAvailable()) {
    clearSessionCookieOnResponse(res);
    return res;
  }
  try {
    await ensureTables();
  } catch {
    clearSessionCookieOnResponse(res);
    return res;
  }
  const raw = readSessionTokenFromRequest(request);
  if (raw) {
    try {
      await deleteSessionByRawToken(getPool()!, raw);
    } catch {
      /* ignore */
    }
  }
  clearSessionCookieOnResponse(res);
  return res;
}
