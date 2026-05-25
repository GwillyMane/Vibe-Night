import { NextResponse } from "next/server";
import { dbAvailable, ensureTables, getPool } from "@/lib/db";
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

  const url = new URL(request.url);
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit")) || 20));
  const cursor = url.searchParams.get("cursor");

  const pool = getPool()!;
  const params: unknown[] = [user.id, limit + 1];
  let cursorClause = "";
  if (cursor && /^\d+$/.test(cursor)) {
    cursorClause = ` AND id < $3::bigint`;
    params.push(cursor);
  }

  const { rows } = await pool.query<{ id: string; kind: string; payload: Record<string, unknown>; created_at: Date }>(
    `SELECT id::text, kind, payload, created_at FROM user_activity
     WHERE user_id = $1::uuid ${cursorClause}
     ORDER BY created_at DESC LIMIT $2`,
    params
  );

  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit).map((r) => ({
    id: r.id,
    kind: r.kind,
    payload: r.payload ?? {},
    createdAt: new Date(r.created_at).toISOString(),
  }));

  return NextResponse.json({
    items,
    nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
  });
}
