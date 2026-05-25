import type { Pool, PoolClient } from "pg";

export type ActivityKind =
  | "streak_milestone"
  | "achievement_unlock"
  | "title_unlock"
  | "personal_best"
  | "leaderboard_top10"
  | "first_daily_win"
  | "passport_generated";

export async function recordActivity(
  pool: Pool | PoolClient,
  userId: string,
  kind: ActivityKind,
  payload: Record<string, unknown>
): Promise<void> {
  await pool.query(
    `INSERT INTO user_activity (user_id, kind, payload) VALUES ($1::uuid, $2, $3::jsonb)`,
    [userId, kind, JSON.stringify(payload)]
  );
}

export async function recordActivities(
  pool: Pool | PoolClient,
  userId: string,
  items: Array<{ kind: ActivityKind; payload: Record<string, unknown> }>
): Promise<void> {
  for (const item of items) {
    await recordActivity(pool, userId, item.kind, item.payload);
  }
}

export async function touchLastActive(pool: Pool | PoolClient, userId: string): Promise<void> {
  await pool.query(
    `UPDATE user_profiles SET last_active_at = NOW(), updated_at = NOW() WHERE user_id = $1::uuid`,
    [userId]
  );
}
