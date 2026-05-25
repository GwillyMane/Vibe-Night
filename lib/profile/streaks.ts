import type { Pool } from "pg";

const NY_TZ = "America/New_York";

export function todayNyDateString(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: NY_TZ });
}

export function yesterdayNyDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString("en-CA", { timeZone: NY_TZ });
}

export interface StreakRow {
  currentStreak: number;
  longestStreak: number;
  lastPlayDate: string | null;
}

export async function getStreak(pool: Pool, userId: string): Promise<StreakRow> {
  const { rows } = await pool.query<{ current_streak: number; longest_streak: number; last_play_date: string | null }>(
    `SELECT current_streak, longest_streak, last_play_date::text AS last_play_date
     FROM user_streaks WHERE user_id = $1::uuid`,
    [userId]
  );
  if (!rows[0]) {
    return { currentStreak: 0, longestStreak: 0, lastPlayDate: null };
  }
  return {
    currentStreak: rows[0].current_streak,
    longestStreak: rows[0].longest_streak,
    lastPlayDate: rows[0].last_play_date,
  };
}

export interface BumpStreakResult extends StreakRow {
  bumped: boolean;
  milestoneDays: number | null;
}

/** Idempotent streak bump for NY calendar day. */
export async function bumpStreak(pool: Pool, userId: string): Promise<BumpStreakResult> {
  const today = todayNyDateString();
  const yesterday = yesterdayNyDateString();
  const existing = await getStreak(pool, userId);

  if (existing.lastPlayDate === today) {
    return { ...existing, bumped: false, milestoneDays: null };
  }

  let current = 1;
  if (existing.lastPlayDate === yesterday) {
    current = existing.currentStreak + 1;
  }
  const longest = Math.max(existing.longestStreak, current);

  await pool.query(
    `INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_play_date, updated_at)
     VALUES ($1::uuid, $2, $3, $4::date, NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       current_streak = EXCLUDED.current_streak,
       longest_streak = GREATEST(user_streaks.longest_streak, EXCLUDED.longest_streak),
       last_play_date = EXCLUDED.last_play_date,
       updated_at = NOW()`,
    [userId, current, longest, today]
  );

  const milestones = [7, 14, 30, 60];
  const milestoneDays = milestones.includes(current) ? current : null;

  return {
    currentStreak: current,
    longestStreak: longest,
    lastPlayDate: today,
    bumped: true,
    milestoneDays,
  };
}

/** Merge local streak into server on login (take max values). */
export async function migrateLocalStreak(
  pool: Pool,
  userId: string,
  local: { currentStreak: number; longestStreak: number; lastPlayDate: string | null }
): Promise<StreakRow> {
  const server = await getStreak(pool, userId);
  const current = Math.max(server.currentStreak, local.currentStreak);
  const longest = Math.max(server.longestStreak, local.longestStreak);
  let lastPlayDate = server.lastPlayDate;
  if (local.lastPlayDate && (!lastPlayDate || local.lastPlayDate > lastPlayDate)) {
    lastPlayDate = local.lastPlayDate;
  }

  await pool.query(
    `INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_play_date, updated_at)
     VALUES ($1::uuid, $2, $3, $4::date, NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       current_streak = GREATEST(user_streaks.current_streak, EXCLUDED.current_streak),
       longest_streak = GREATEST(user_streaks.longest_streak, EXCLUDED.longest_streak),
       last_play_date = COALESCE(
         GREATEST(user_streaks.last_play_date, EXCLUDED.last_play_date),
         user_streaks.last_play_date,
         EXCLUDED.last_play_date
       ),
       updated_at = NOW()`,
    [userId, current, longest, lastPlayDate]
  );

  return getStreak(pool, userId);
}
