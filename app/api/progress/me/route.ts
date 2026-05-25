import { NextResponse } from "next/server";
import { dbAvailable, ensureTables, getPool } from "@/lib/db";
import { fetchProfileMe } from "@/lib/profile/queries";
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
  const [lv, dy, ach, goals, settings, profile, gameStats] = await Promise.all([
    pool.query(
      `SELECT level_id AS "levelId", best_score AS "bestScore", best_stars AS "bestStars",
              best_shots_used AS "bestShotsUsed", completed, updated_at AS "updatedAt"
       FROM user_level_progress WHERE user_id = $1::uuid ORDER BY level_id`,
      [user.id]
    ),
    pool.query(
      `SELECT daily_seed AS "dailySeed", level_id AS "levelId", best_score AS "bestScore", best_stars AS "bestStars",
              best_shots_used AS "bestShotsUsed", completed, played_at AS "playedAt"
       FROM user_daily_progress WHERE user_id = $1::uuid ORDER BY played_at DESC`,
      [user.id]
    ),
    pool.query(
      `SELECT game_id AS "gameId", achievement_id AS "achievementId", unlocked_at AS "unlockedAt"
       FROM user_achievements WHERE user_id = $1::uuid`,
      [user.id]
    ),
    pool.query(
      `SELECT game_id AS "gameId", goal_id AS "goalId", progress, completed, updated_at AS "updatedAt"
       FROM user_goals WHERE user_id = $1::uuid`,
      [user.id]
    ),
    pool.query(
      `SELECT selected_projectile AS "selectedProjectile", sound_muted AS "soundMuted", reduced_motion AS "reducedMotion", updated_at AS "updatedAt"
       FROM user_settings WHERE user_id = $1::uuid`,
      [user.id]
    ),
    fetchProfileMe(pool, user.id),
    pool.query(
      `SELECT game_id AS "gameId", stats_json AS "statsJson"
       FROM user_game_stats WHERE user_id = $1::uuid`,
      [user.id]
    ),
  ]);

  return NextResponse.json({
    levelProgress: lv.rows,
    dailyProgress: dy.rows,
    achievements: ach.rows,
    goals: goals.rows,
    settings: settings.rows[0] ?? null,
    profile,
    gameStats: gameStats.rows,
  });
}
