import { NextResponse } from "next/server";
import { dbAvailable, ensureTables, getPool } from "@/lib/db";
import { clientIp, rateLimitAllow } from "@/lib/rateLimit";
import { recordActivity, touchLastActive } from "@/lib/profile/activity";
import type { ArcadeGameSyncPayload } from "@/lib/profile/syncMerge";
import { titleById } from "@/lib/profile/catalog";
import { upsertGameStats, fetchProfileMe } from "@/lib/profile/queries";
import { evaluateAndPersistUnlocks, ensureProfileRow } from "@/lib/profile/unlocks";
import { getCurrentUserFromRequest } from "@/lib/session";
import type { LifetimeCounters } from "@/lib/storage";
import type { GameStatsJson } from "@/lib/profile/types";

export const runtime = "nodejs";

type SyncBody = {
  levelBests?: Record<string, { score: number; stars: number }>;
  dailyBests?: Record<string, { seed: string; levelId: string; score: number; stars: number }>;
  achievements?: string[];
  goals?: Record<string, { progress: number; completed: boolean }>;
  selectedProjectile?: string | null;
  soundMuted?: boolean;
  reducedMotion?: boolean | null;
  lifetimeCounters?: LifetimeCounters;
  vibeMerge?: ArcadeGameSyncPayload;
  vibeGarden?: ArcadeGameSyncPayload;
  catchAVibe?: ArcadeGameSyncPayload;
  vibeShift?: ArcadeGameSyncPayload;
  luckyVibes?: ArcadeGameSyncPayload;
};

async function syncGamePayload(
  client: import("pg").PoolClient,
  userId: string,
  gameId: string,
  payload: ArcadeGameSyncPayload | undefined
): Promise<void> {
  if (!payload?.stats || typeof payload.stats !== "object") return;
  await upsertGameStats(client as unknown as import("pg").Pool, userId, gameId, payload.stats);
}

function crashersStatsFromBody(body: SyncBody): GameStatsJson {
  const lc = body.lifetimeCounters;
  let levelsCleared = 0;
  if (body.levelBests) {
    levelsCleared = Object.keys(body.levelBests).filter((k) => k.startsWith("lv:")).length;
  }
  return {
    glassBreaks: lc?.glassBreaks ?? 0,
    bestTargetsOneLaunch: lc?.bestTargetsOneLaunch ?? 0,
    bestBlocksOneLaunch: lc?.bestBlocksOneLaunch ?? 0,
    hasOneShotWin: lc?.hasOneShotWin ?? false,
    structuresDestroyed: lc?.glassBreaks ?? 0,
    levelsCleared,
    maxCombo: lc?.bestTargetsOneLaunch ?? 0,
  };
}

export async function POST(request: Request) {
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

  if (!rateLimitAllow(`progress:user:${user.id}`, 20, 60_000)) {
    return NextResponse.json({ error: "Too many sync requests. Try again shortly." }, { status: 429 });
  }
  if (!rateLimitAllow(`progress:ip:${clientIp(request)}`, 40, 60_000)) {
    return NextResponse.json({ error: "Too many sync requests. Try again shortly." }, { status: 429 });
  }

  let body: SyncBody = {};
  try {
    body = (await request.json()) as SyncBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const pool = getPool()!;
  await ensureProfileRow(pool, user.id);

  const c = await pool.connect();
  try {
    await c.query("BEGIN");

    if (body.levelBests && typeof body.levelBests === "object") {
      for (const [key, val] of Object.entries(body.levelBests)) {
        if (!key.startsWith("lv:")) continue;
        const levelId = key.slice(3);
        if (!levelId) continue;
        const score = Number(val?.score);
        const stars = Number(val?.stars);
        if (!Number.isFinite(score) || score < 0 || score > 10_000_000) continue;
        if (!Number.isFinite(stars) || stars < 0 || stars > 3) continue;
        await c.query(
          `INSERT INTO user_level_progress (user_id, level_id, best_score, best_stars, completed, updated_at)
           VALUES ($1::uuid, $2, $3, $4, $5, NOW())
           ON CONFLICT (user_id, level_id) DO UPDATE SET
             best_score = GREATEST(user_level_progress.best_score, EXCLUDED.best_score),
             best_stars = GREATEST(user_level_progress.best_stars, EXCLUDED.best_stars),
             completed = user_level_progress.completed OR EXCLUDED.completed,
             updated_at = NOW()`,
          [user.id, levelId, score, stars, stars >= 1 || score > 0]
        );
      }
    }

    if (body.dailyBests && typeof body.dailyBests === "object") {
      for (const [key, val] of Object.entries(body.dailyBests)) {
        if (!key.startsWith("daily:")) continue;
        const parts = key.split(":");
        if (parts.length < 3) continue;
        const seed = parts[1] ?? val?.seed;
        const levelId = parts[2] ?? val?.levelId;
        if (!seed || !levelId) continue;
        const score = Number(val?.score);
        const stars = Number(val?.stars);
        if (!Number.isFinite(score) || score < 0 || score > 10_000_000) continue;
        if (!Number.isFinite(stars) || stars < 0 || stars > 3) continue;
        await c.query(
          `INSERT INTO user_daily_progress (user_id, daily_seed, level_id, best_score, best_stars, completed, played_at)
           VALUES ($1::uuid, $2, $3, $4, $5, $6, NOW())
           ON CONFLICT (user_id, daily_seed) DO UPDATE SET
             level_id = EXCLUDED.level_id,
             best_score = GREATEST(user_daily_progress.best_score, EXCLUDED.best_score),
             best_stars = GREATEST(user_daily_progress.best_stars, EXCLUDED.best_stars),
             completed = user_daily_progress.completed OR EXCLUDED.completed,
             played_at = NOW()`,
          [user.id, seed, levelId, score, stars, stars >= 1 || score > 0]
        );
      }
    }

    if (body.goals && typeof body.goals === "object") {
      for (const [gid, gv] of Object.entries(body.goals)) {
        if (typeof gid !== "string" || gid.length > 64) continue;
        const progress = Math.max(0, Math.floor(Number(gv?.progress) || 0));
        const completed = Boolean(gv?.completed);
        await c.query(
          `INSERT INTO user_goals (user_id, game_id, goal_id, progress, completed, updated_at)
           VALUES ($1::uuid, 'vibe-crashers', $2, $3, $4, NOW())
           ON CONFLICT (user_id, game_id, goal_id) DO UPDATE SET
             progress = GREATEST(user_goals.progress, EXCLUDED.progress),
             completed = user_goals.completed OR EXCLUDED.completed,
             updated_at = NOW()`,
          [user.id, gid, progress, completed]
        );
      }
    }

    if (body.lifetimeCounters && typeof body.lifetimeCounters === "object") {
      const lc = body.lifetimeCounters;
      const glass = Math.max(0, Math.min(1_000_000, Math.floor(Number(lc.glassBreaks) || 0)));
      const bestT = Math.max(0, Math.min(100, Math.floor(Number(lc.bestTargetsOneLaunch) || 0)));
      const skins = Array.isArray(lc.winSkinsUsed) ? lc.winSkinsUsed.filter((s) => typeof s === "string" && s.length < 64).slice(0, 30) : [];
      const underPar = Math.max(0, Math.min(10_000, Math.floor(Number(lc.underParWins) || 0)));
      const goalUpdates: Array<[string, number, boolean]> = [
        ["glass-25", Math.min(glass, 25), glass >= 25],
        ["combo-3", bestT >= 3 ? 1 : 0, bestT >= 3],
        ["skins-3", Math.min(skins.length, 3), skins.length >= 3],
        ["under-par", Math.min(underPar, 5), underPar >= 5],
      ];
      for (const [gid, progress, completed] of goalUpdates) {
        await c.query(
          `INSERT INTO user_goals (user_id, game_id, goal_id, progress, completed, updated_at)
           VALUES ($1::uuid, 'vibe-crashers', $2, $3, $4, NOW())
           ON CONFLICT (user_id, game_id, goal_id) DO UPDATE SET
             progress = GREATEST(user_goals.progress, EXCLUDED.progress),
             completed = user_goals.completed OR EXCLUDED.completed,
             updated_at = NOW()`,
          [user.id, gid, progress, completed]
        );
      }
    }

    await upsertGameStats(pool, user.id, "vibe-crashers", crashersStatsFromBody(body));

    await syncGamePayload(c, user.id, "vibe-merge", body.vibeMerge);
    await syncGamePayload(c, user.id, "vibe-garden", body.vibeGarden);
    await syncGamePayload(c, user.id, "catch-a-vibe", body.catchAVibe);
    await syncGamePayload(c, user.id, "vibe-shift", body.vibeShift);
    await syncGamePayload(c, user.id, "lucky-vibes", body.luckyVibes);

    const proj = typeof body.selectedProjectile === "string" && body.selectedProjectile.length < 128 ? body.selectedProjectile : null;
    const sm = typeof body.soundMuted === "boolean" ? body.soundMuted : false;
    const rm = body.reducedMotion === null || body.reducedMotion === undefined ? null : Boolean(body.reducedMotion);
    await c.query(
      `INSERT INTO user_settings (user_id, selected_projectile, sound_muted, reduced_motion, updated_at)
       VALUES ($1::uuid, $2, $3, $4, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         selected_projectile = COALESCE(EXCLUDED.selected_projectile, user_settings.selected_projectile),
         sound_muted = EXCLUDED.sound_muted,
         reduced_motion = COALESCE(EXCLUDED.reduced_motion, user_settings.reduced_motion),
         updated_at = NOW()`,
      [user.id, proj, sm, rm]
    );

    await c.query("COMMIT");
  } catch (e) {
    await c.query("ROLLBACK").catch(() => undefined);
    console.error(e);
    return NextResponse.json({ error: "Sync failed." }, { status: 500 });
  } finally {
    c.release();
  }

  await touchLastActive(pool, user.id);
  const unlocks = await evaluateAndPersistUnlocks(pool, user.id);

  for (const titleId of unlocks.newTitles) {
    const t = titleById(titleId);
    await recordActivity(pool, user.id, "title_unlock", { label: t?.label ?? titleId, titleId });
  }

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
    ok: true,
    levelProgress: lv.rows,
    dailyProgress: dy.rows,
    achievements: ach.rows,
    goals: goals.rows,
    settings: settings.rows[0] ?? null,
    profile,
    gameStats: gameStats.rows,
  });
}
