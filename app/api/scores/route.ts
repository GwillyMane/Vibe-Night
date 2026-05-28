import { NextResponse } from "next/server";
import { dbAvailable, ensureTables, getPool, sqlNyDayStart, sqlNyWeekStart } from "@/lib/db";
import { clientIp, rateLimitCheck } from "@/lib/rateLimit";
import { reportError } from "@/lib/observability";
import { validateScorePayload } from "@/lib/scoreValidation";
import { MERGE_GAME_ID } from "@/lib/vibe-merge/mergeConfig";
import { validateMergeScorePayload } from "@/lib/vibe-merge/mergeScoreValidation";
import { GARDEN_GAME_ID } from "@/lib/vibe-garden/gardenConfig";
import { validateGardenScorePayload } from "@/lib/vibe-garden/gardenScoreValidation";
import { CATCH_GAME_ID } from "@/lib/catch-a-vibe/catchConfig";
import { validateCatchScorePayload } from "@/lib/catch-a-vibe/catchScoreValidation";
import { SHIFT_GAME_ID } from "@/lib/vibe-shift/shiftConfig";
import { validateShiftScorePayload } from "@/lib/vibe-shift/shiftScoreValidation";
import { LUCKY_GAME_ID } from "@/lib/lucky-vibes/luckyConfig";
import { validateLuckyScorePayload } from "@/lib/lucky-vibes/luckyScoreValidation";
import { getCurrentUserFromRequest } from "@/lib/session";
import { recordActivity, touchLastActive } from "@/lib/profile/activity";
import { evaluateAndPersistUnlocks, ensureProfileRow } from "@/lib/profile/unlocks";
import { upsertGameStats, reconcileProfileAchievements } from "@/lib/profile/queries";
import { GAME_LIBRARY, isKnownGameId } from "@/lib/games/catalog";
import type { LeaderboardApiRow } from "@/lib/leaderboardApi";
import { verifyScoreReplay } from "@/lib/scoreReplay";

export const runtime = "nodejs";

function isArcadeScoreGame(gameId: string): boolean {
  return gameId === MERGE_GAME_ID || gameId === GARDEN_GAME_ID || gameId === CATCH_GAME_ID || gameId === SHIFT_GAME_ID || gameId === LUCKY_GAME_ID;
}

function scopeTimeSql(scope: string): string {
  if (scope === "daily") return `created_at >= ${sqlNyDayStart}`;
  if (scope === "weekly") return `created_at >= ${sqlNyWeekStart}`;
  return "TRUE";
}

export async function GET(request: Request) {
  if (!dbAvailable()) {
    return NextResponse.json({ error: "Database is not configured.", rows: [] }, { status: 503 });
  }
  try {
    await ensureTables();
  } catch {
    return NextResponse.json({ error: "Database unavailable.", rows: [] }, { status: 503 });
  }

  try {
  const url = new URL(request.url);
  const scope = (url.searchParams.get("scope") ?? "daily").toLowerCase();
  const gameId = url.searchParams.get("gameId") ?? "vibe-crashers";
  const mode = (url.searchParams.get("mode") ?? "level").toLowerCase();
  if (!["daily", "weekly", "alltime"].includes(scope)) {
    return NextResponse.json({ error: "Invalid scope" }, { status: 400 });
  }
  if (isArcadeScoreGame(gameId)) {
    if (mode !== "classic" && mode !== "daily") {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }
  } else if (mode !== "level" && mode !== "daily") {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  }
  const levelId = url.searchParams.get("levelId");
  const seed = url.searchParams.get("seed");
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit")) || 10));
  const includeMe = url.searchParams.get("includeMe") === "1" || url.searchParams.get("includeMe") === "true";

  const pool = getPool()!;
  const timePred = scopeTimeSql(scope);
  const params: unknown[] = [gameId, mode, limit];
  let p = 4;
  let levelClause = "";
  if (levelId) {
    levelClause = ` AND level_id = $${p}::text`;
    params.push(levelId);
    p++;
  }
  let seedClause = "";
  if (seed) {
    seedClause = ` AND seed = $${p}::text`;
    params.push(seed);
    p++;
  }

  const sql = `
    WITH ranked AS (
      SELECT id, username, score, stars, shots_used AS "shotsUsed", shots_total AS "shotsTotal",
             level_id AS "levelId", mode, seed, created_at,
             ROW_NUMBER() OVER (ORDER BY score DESC, created_at ASC) AS rank
      FROM leaderboard_scores
      WHERE game_id = $1::text AND mode = $2::text
        AND (${timePred})
        ${levelClause}
        ${seedClause}
    )
    SELECT rank, username, score, stars, "shotsUsed", "shotsTotal", "levelId", mode, seed, created_at
    FROM ranked
    WHERE rank <= $3::int
    ORDER BY rank ASC
  `;

  const { rows } = await pool.query<{
    rank: string;
    username: string;
    score: number;
    stars: number;
    shotsUsed: number;
    shotsTotal: number;
    levelId: string;
    mode: string;
    seed: string | null;
    created_at: Date;
  }>(sql, params);

  const outRows: LeaderboardApiRow[] = rows.map((r) => ({
    rank: Number(r.rank),
    username: r.username,
    score: r.score,
    stars: r.stars,
    shotsUsed: r.shotsUsed,
    shotsTotal: r.shotsTotal,
    levelId: r.levelId,
    mode: r.mode,
    seed: r.seed,
    createdAt: new Date(r.created_at).toISOString(),
  }));

  let me: LeaderboardApiRow | undefined;
  if (includeMe) {
    const user = await getCurrentUserFromRequest(request);
    if (user) {
      const mp: unknown[] = [gameId, mode, user.id];
      let q = 4;
      let lc = "";
      if (levelId) {
        lc = ` AND level_id = $${q}::text`;
        mp.push(levelId);
        q++;
      }
      let sc = "";
      if (seed) {
        sc = ` AND seed = $${q}::text`;
        mp.push(seed);
        q++;
      }
      const bestSql = `
        SELECT id, username, score, stars, shots_used AS "shotsUsed", shots_total AS "shotsTotal",
               level_id AS "levelId", mode, seed, created_at
        FROM leaderboard_scores
        WHERE game_id = $1::text AND mode = $2::text AND user_id = $3::uuid AND (${timePred}) ${lc} ${sc}
        ORDER BY score DESC, created_at ASC
        LIMIT 1
      `;
      const br = await pool.query<{
        id: string;
        username: string;
        score: number;
        stars: number;
        shotsUsed: number;
        shotsTotal: number;
        levelId: string;
        mode: string;
        seed: string | null;
        created_at: Date;
      }>(bestSql, mp);
      const mine = br.rows[0];
      if (mine) {
        const rp: unknown[] = [gameId, mode];
        const rankConds = [
          `f.game_id = $1::text`,
          `f.mode = $2::text`,
          `(${timePred.replace(/\bcreated_at\b/g, "f.created_at")})`,
        ];
        let rpIdx = 3;
        if (levelId) {
          rankConds.push(`f.level_id = $${rpIdx}::text`);
          rp.push(levelId);
          rpIdx++;
        }
        if (seed) {
          rankConds.push(`f.seed = $${rpIdx}::text`);
          rp.push(seed);
          rpIdx++;
        }
        rankConds.push(
          `(f.score > $${rpIdx}::int OR (f.score = $${rpIdx}::int AND f.created_at < $${rpIdx + 1}::timestamptz))`,
        );
        rp.push(mine.score, mine.created_at);

        const { rows: rc } = await pool.query<{ c: number }>(
          `SELECT COUNT(*)::int AS c FROM leaderboard_scores f WHERE ${rankConds.join(" AND ")}`,
          rp,
        );
        const rank = (rc[0]?.c ?? 0) + 1;
        me = {
          rank,
          username: mine.username,
          score: mine.score,
          stars: mine.stars,
          shotsUsed: mine.shotsUsed,
          shotsTotal: mine.shotsTotal,
          levelId: mine.levelId,
          mode: mine.mode,
          seed: mine.seed,
          createdAt: new Date(mine.created_at).toISOString(),
        };
      }
    }
  }

  return NextResponse.json({ rows: outRows, ...(me ? { me } : {}) });
  } catch (e) {
    console.error("[GET /api/scores]", e);
    reportError("GET /api/scores", e);
    return NextResponse.json({ error: "Could not load leaderboard.", rows: [] }, { status: 500 });
  }
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
    return NextResponse.json({ error: "Sign in to submit scores." }, { status: 401 });
  }

  if (!(await rateLimitCheck(`scores:user:${user.id}`, 30, 60_000))) {
    return NextResponse.json({ error: "Too many submissions. Try again shortly." }, { status: 429 });
  }
  if (!(await rateLimitCheck(`scores:ip:${clientIp(request)}`, 60, 60_000))) {
    return NextResponse.json({ error: "Too many submissions. Try again shortly." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const b = body as {
    gameId?: string;
    mode?: string;
    levelId?: string;
    seed?: string | null;
    score?: number;
    stars?: number;
    shotsUsed?: number;
    shotsTotal?: number;
    moves_json?: string | null;
    run_hash?: string | null;
    client_version?: string | null;
    runSeed?: string | null;
    won?: boolean;
  };

  const won = b.won !== false;
  const gameId = String(b.gameId ?? "vibe-crashers");
  if (!isKnownGameId(gameId)) {
    return NextResponse.json({ error: "Unknown game." }, { status: 400 });
  }
  const payload = {
    mode: String(b.mode ?? ""),
    levelId: String(b.levelId ?? ""),
    seed: b.seed,
    score: Number(b.score),
    stars: Number(b.stars ?? 0),
    shotsUsed: Number(b.shotsUsed),
    shotsTotal: Number(b.shotsTotal ?? 999),
  };
  const v =
    gameId === MERGE_GAME_ID
      ? validateMergeScorePayload(payload)
      : gameId === GARDEN_GAME_ID
        ? validateGardenScorePayload(payload)
        : gameId === CATCH_GAME_ID
          ? validateCatchScorePayload(payload)
          : gameId === SHIFT_GAME_ID
            ? validateShiftScorePayload(payload)
            : gameId === LUCKY_GAME_ID
              ? validateLuckyScorePayload(payload)
              : validateScorePayload(payload);
  if (!v.ok) {
    return NextResponse.json({ error: v.error }, { status: 400 });
  }

  const submittedScore = payload.score;

  if (!won) {
    return NextResponse.json({ error: "Only winning runs can be submitted." }, { status: 400 });
  }

  const movesJson =
    typeof b.moves_json === "string" && b.moves_json.length > 50_000 ? b.moves_json.slice(0, 50_000) : b.moves_json ?? null;

  const replay = verifyScoreReplay({
    gameId,
    mode: payload.mode,
    levelId: b.levelId,
    score: submittedScore,
    seed: b.seed,
    runSeed: b.runSeed,
    movesJson,
    shotsUsed: payload.shotsUsed,
  });
  if (!replay.ok) {
    return NextResponse.json({ error: replay.error }, { status: 400 });
  }

  const pool = getPool()!;
  const runHash = typeof b.run_hash === "string" && b.run_hash.length <= 128 ? b.run_hash : null;
  const clientVersion = typeof b.client_version === "string" && b.client_version.length <= 64 ? b.client_version : null;

  if (runHash) {
    const dup = await pool.query(
      `SELECT 1 FROM leaderboard_scores
       WHERE user_id = $1::uuid AND run_hash = $2 AND created_at > NOW() - INTERVAL '15 minutes' LIMIT 1`,
      [user.id, runHash]
    );
    if (dup.rowCount) {
      return NextResponse.json({ error: "Duplicate submission." }, { status: 409 });
    }
  }

  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    const ins = await c.query<{ id: string; created_at: Date }>(
      `INSERT INTO leaderboard_scores
        (user_id, username, game_id, mode, level_id, seed, score, stars, shots_used, shots_total, moves_json, run_hash, client_version)
       VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id, created_at`,
      [
        user.id,
        user.username,
        gameId,
        b.mode,
        b.levelId,
        b.mode === "daily" ? b.seed : null,
        b.score,
        b.stars,
        b.shotsUsed,
        b.shotsTotal,
        movesJson,
        runHash,
        clientVersion,
      ]
    );
    const row = ins.rows[0]!;

    if (isArcadeScoreGame(gameId)) {
      /* Big Vibes / Vibe Garden: leaderboard row only */
    } else if (b.mode === "level") {
      await c.query(
        `INSERT INTO user_level_progress (user_id, level_id, best_score, best_stars, best_shots_used, completed, updated_at)
         VALUES ($1::uuid, $2, $3, $4, $5, TRUE, NOW())
         ON CONFLICT (user_id, level_id) DO UPDATE SET
           best_score = GREATEST(user_level_progress.best_score, EXCLUDED.best_score),
           best_stars = GREATEST(user_level_progress.best_stars, EXCLUDED.best_stars),
           best_shots_used = CASE
             WHEN EXCLUDED.best_score > user_level_progress.best_score THEN EXCLUDED.best_shots_used
             WHEN EXCLUDED.best_score = user_level_progress.best_score THEN LEAST(COALESCE(user_level_progress.best_shots_used, 9999), EXCLUDED.best_shots_used)
             ELSE user_level_progress.best_shots_used
           END,
           completed = user_level_progress.completed OR TRUE,
           updated_at = NOW()`,
        [user.id, b.levelId, b.score, b.stars, b.shotsUsed]
      );
    } else if (b.mode === "daily" && b.seed) {
      await c.query(
        `INSERT INTO user_daily_progress (user_id, daily_seed, level_id, best_score, best_stars, best_shots_used, completed, played_at)
         VALUES ($1::uuid, $2, $3, $4, $5, $6, TRUE, NOW())
         ON CONFLICT (user_id, daily_seed) DO UPDATE SET
           level_id = EXCLUDED.level_id,
           best_score = GREATEST(user_daily_progress.best_score, EXCLUDED.best_score),
           best_stars = GREATEST(user_daily_progress.best_stars, EXCLUDED.best_stars),
           best_shots_used = CASE
             WHEN EXCLUDED.best_score > user_daily_progress.best_score THEN EXCLUDED.best_shots_used
             WHEN EXCLUDED.best_score = user_daily_progress.best_score THEN LEAST(COALESCE(user_daily_progress.best_shots_used, 9999), EXCLUDED.best_shots_used)
             ELSE user_daily_progress.best_shots_used
           END,
           completed = user_daily_progress.completed OR TRUE,
           played_at = NOW()`,
        [user.id, b.seed, b.levelId, b.score, b.stars, b.shotsUsed]
      );
    }

    await c.query("COMMIT");

    const timePred = scopeTimeSql("alltime");
    const rankSeed = b.mode === "daily" && gameId !== LUCKY_GAME_ID ? b.seed : null;
    const { rows: rankRows } = await pool.query<{ c: number }>(
      `SELECT COUNT(*)::int AS c FROM leaderboard_scores f
       WHERE f.game_id = $1::text AND f.mode = $2::text AND (${timePred})
         AND f.level_id = $3::text
         AND ($4::text IS NULL OR f.seed IS NOT DISTINCT FROM $4::text)
         AND (f.score > $5::int OR (f.score = $5::int AND f.created_at < $6::timestamptz))`,
      [gameId, b.mode, b.levelId, rankSeed, submittedScore, row.created_at]
    );
    const rank = (rankRows[0]?.c ?? 0) + 1;

    let bestScore = submittedScore;
    let bestStars = b.stars;
    if (!isArcadeScoreGame(gameId)) {
      const prog = await pool.query<{ best_score: number; best_stars: number }>(
        b.mode === "daily"
          ? `SELECT best_score, best_stars FROM user_daily_progress WHERE user_id = $1::uuid AND daily_seed = $2`
          : `SELECT best_score, best_stars FROM user_level_progress WHERE user_id = $1::uuid AND level_id = $2`,
        b.mode === "daily" ? [user.id, b.seed] : [user.id, b.levelId]
      );
      bestScore = prog.rows[0]?.best_score ?? submittedScore;
      bestStars = prog.rows[0]?.best_stars ?? b.stars;
    }

    await ensureProfileRow(pool, user.id);
    await touchLastActive(pool, user.id);

    const gameLabel = GAME_LIBRARY.find((g) => g.id === gameId)?.shortTitle ?? gameId;
    if (submittedScore >= bestScore) {
      await recordActivity(pool, user.id, "personal_best", {
        label: `New ${gameLabel} personal best`,
        gameId,
        score: submittedScore,
        mode: b.mode,
      });
    }
    if (rank <= 10) {
      await recordActivity(pool, user.id, "leaderboard_top10", {
        label: `Top 10 in ${gameLabel}${b.mode === "daily" ? " Daily" : ""}`,
        gameId,
        rank,
        score: submittedScore,
      });
    }
    if (b.mode === "daily") {
      await recordActivity(pool, user.id, "first_daily_win", {
        label: `Daily win in ${gameLabel}`,
        gameId,
        score: submittedScore,
      });
    }

    const statsPatch: Record<string, number> = { bestClassic: submittedScore };
    if (b.mode === "daily") statsPatch.bestDaily = submittedScore;
    if (b.mode === "daily") statsPatch.dailyWins = 1;
    await upsertGameStats(pool, user.id, gameId, statsPatch);
    await evaluateAndPersistUnlocks(pool, user.id);
    await reconcileProfileAchievements(pool, user.id).catch((e) =>
      reportError("POST /api/scores reconcile", e)
    );

    return NextResponse.json({
      ok: true,
      rank,
      bestScore,
      bestStars,
      row: {
        id: row.id,
        score: b.score,
        stars: b.stars,
        createdAt: new Date(row.created_at).toISOString(),
      },
    });
  } catch (e) {
    await c.query("ROLLBACK").catch(() => undefined);
    console.error(e);
    return NextResponse.json({ error: "Could not save score." }, { status: 500 });
  } finally {
    c.release();
  }
}
