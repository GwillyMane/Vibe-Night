import { createHash, randomBytes } from "crypto";
import type { Pool } from "pg";
import type { NextResponse } from "next/server";
import { getPool } from "./db";

export const DEFAULT_COOKIE_NAME = "vibe_crashers_session";

export function cookieName(): string {
  return process.env.AUTH_COOKIE_NAME?.trim() || DEFAULT_COOKIE_NAME;
}

export function sessionDays(): number {
  const n = Number(process.env.AUTH_SESSION_DAYS);
  return Number.isFinite(n) && n > 0 && n <= 365 ? Math.floor(n) : 30;
}

export function hashSessionToken(rawToken: string): string {
  return createHash("sha256").update(rawToken, "utf8").digest("hex");
}

export function readSessionTokenFromRequest(request: Request): string | null {
  const cookie = request.headers.get("cookie");
  if (!cookie) return null;
  const name = cookieName();
  const parts = cookie.split(";").map((p) => p.trim());
  for (const p of parts) {
    if (p.startsWith(`${name}=`)) {
      return decodeURIComponent(p.slice(name.length + 1));
    }
  }
  return null;
}

export function appendSetCookieHeader(headers: Headers, value: string): void {
  headers.append("Set-Cookie", value);
}

export function buildSessionCookieValue(token: string, maxAgeSec: number): string {
  const name = cookieName();
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${name}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${secure}`;
}

export function buildClearSessionCookieValue(): string {
  const name = cookieName();
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

export function setSessionCookieOnResponse(res: NextResponse, token: string): void {
  const maxAge = sessionDays() * 86400;
  res.headers.append("Set-Cookie", buildSessionCookieValue(token, maxAge));
}

export function clearSessionCookieOnResponse(res: NextResponse): void {
  res.headers.append("Set-Cookie", buildClearSessionCookieValue());
}

export interface SafeUser {
  id: string;
  username: string;
  created_at: string;
}

export async function createSessionForUser(pool: Pool, userId: string): Promise<{ rawToken: string; expiresAt: Date }> {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashSessionToken(rawToken);
  const expiresAt = new Date(Date.now() + sessionDays() * 86400000);
  await pool.query(
    `INSERT INTO sessions (user_id, session_token_hash, expires_at, last_seen_at)
     VALUES ($1::uuid, $2, $3::timestamptz, NOW())`,
    [userId, tokenHash, expiresAt.toISOString()]
  );
  return { rawToken, expiresAt };
}

export async function deleteSessionByRawToken(pool: Pool, rawToken: string): Promise<void> {
  const h = hashSessionToken(rawToken);
  await pool.query(`DELETE FROM sessions WHERE session_token_hash = $1`, [h]);
}

export async function getCurrentUserFromRequest(request: Request): Promise<SafeUser | null> {
  const pool = getPool();
  if (!pool) return null;
  const raw = readSessionTokenFromRequest(request);
  if (!raw) return null;
  const h = hashSessionToken(raw);
  const { rows } = await pool.query<{
    id: string;
    username: string;
    created_at: Date;
    session_id: string;
  }>(
    `SELECT u.id, u.username, u.created_at, s.id AS session_id
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.session_token_hash = $1 AND s.expires_at > NOW()`,
    [h]
  );
  if (!rows[0]) return null;
  const row = rows[0];
  await pool.query(`UPDATE sessions SET last_seen_at = NOW() WHERE id = $1::uuid`, [row.session_id]);
  return {
    id: row.id,
    username: row.username,
    created_at: new Date(row.created_at).toISOString(),
  };
}
