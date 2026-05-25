import type { Pool, PoolClient } from "pg";
import {
  DEFAULT_TITLE_ID,
  PROFILE_TITLES,
  allCosmetics,
  achievementKey,
  type ProfileTitleDef,
  type CosmeticDef,
} from "./catalog";
import type { UnlockContext, GameStatsJson } from "./types";
import { computeIdentity } from "./identityScore";
import { getStreak } from "./streaks";

function cosmeticKey(type: string, id: string): string {
  return `${type}:${id}`;
}

function hasAchievement(ctx: UnlockContext, gameId: string, slug: string): boolean {
  return ctx.achievementKeys.has(achievementKey(gameId as "vibe-crashers", slug));
}

function maxComboAcrossGames(stats: Record<string, GameStatsJson>): number {
  let max = 0;
  for (const s of Object.values(stats)) {
    max = Math.max(max, s.maxCombo ?? 0);
  }
  return max;
}

function titleUnlocked(title: ProfileTitleDef, ctx: UnlockContext): boolean {
  if (title.defaultOwned) return true;
  switch (title.unlockRule) {
    case "default":
      return true;
    case "achievement": {
      const gameId = String(title.unlockParams?.gameId ?? "");
      const slug = String(title.unlockParams?.slug ?? "");
      return hasAchievement(ctx, gameId, slug);
    }
    case "stat": {
      const stat = title.unlockParams?.stat;
      if (stat === "maxCombo") {
        return maxComboAcrossGames(ctx.gameStats) >= Number(title.unlockParams?.min ?? 25);
      }
      if (stat === "zenParticipation") {
        for (const s of Object.values(ctx.gameStats)) {
          if ((s.zenParticipation ?? 0) >= 1) return true;
        }
        return false;
      }
      return false;
    }
    case "tier":
      return ctx.arcadeTier === title.unlockParams?.tier;
    case "diversity":
      return ctx.gamesWithScores.size >= Number(title.unlockParams?.gamesWithScores ?? 4);
    default:
      return false;
  }
}

function cosmeticUnlocked(c: CosmeticDef, ctx: UnlockContext): boolean {
  if (c.defaultOwned) return true;
  switch (c.unlockRule) {
    case "default":
      return true;
    case "achievement": {
      const gameId = String(c.unlockParams?.gameId ?? "");
      const slug = String(c.unlockParams?.slug ?? "");
      return hasAchievement(ctx, gameId, slug);
    }
    case "tier":
      return ctx.arcadeTier === c.unlockParams?.tier;
    case "streak":
      return ctx.streak.currentStreak >= Number(c.unlockParams?.days ?? 0);
    default:
      return false;
  }
}

export async function loadUnlockContext(pool: Pool | PoolClient, userId: string): Promise<UnlockContext> {
  const [achRows, titleRows, cosmeticRows, streak, statsRows, scoreGames] = await Promise.all([
    pool.query<{ game_id: string; achievement_id: string }>(
      `SELECT game_id, achievement_id FROM user_achievements WHERE user_id = $1::uuid`,
      [userId]
    ),
    pool.query<{ title_id: string }>(`SELECT title_id FROM user_titles WHERE user_id = $1::uuid`, [userId]),
    pool.query<{ cosmetic_type: string; cosmetic_id: string }>(
      `SELECT cosmetic_type, cosmetic_id FROM user_unlocked_cosmetics WHERE user_id = $1::uuid`,
      [userId]
    ),
    getStreak(pool as Pool, userId),
    pool.query<{ game_id: string; stats_json: GameStatsJson }>(
      `SELECT game_id, stats_json FROM user_game_stats WHERE user_id = $1::uuid`,
      [userId]
    ),
    pool.query<{ game_id: string }>(
      `SELECT DISTINCT game_id FROM leaderboard_scores WHERE user_id = $1::uuid`,
      [userId]
    ),
  ]);

  const achievementKeys = new Set(
    achRows.rows.map((r) => achievementKey(r.game_id as "vibe-crashers", r.achievement_id))
  );
  const gameStats: Record<string, GameStatsJson> = {};
  for (const r of statsRows.rows) {
    gameStats[r.game_id] = r.stats_json ?? {};
  }

  let totalArcadeScore = 0;
  let legendaryMoments = 0;
  for (const s of Object.values(gameStats)) {
    totalArcadeScore += (s.bestClassic ?? 0) + (s.bestDaily ?? 0);
    if ((s.highestTierEver ?? 0) >= 10) legendaryMoments++;
    if ((s.maxBloomChain ?? 0) >= 25) legendaryMoments++;
    if ((s.bestClassic ?? 0) >= 8000 && (s.totalCatches ?? 0) > 0) legendaryMoments++;
  }

  const { vibeRank, arcadeTier } = computeIdentity({
    achievementCount: achievementKeys.size,
    currentStreak: streak.currentStreak,
    gamesWithScores: scoreGames.rows.length,
    totalArcadeScore,
    legendaryMoments,
  });

  return {
    achievementKeys,
    ownedTitleIds: new Set(titleRows.rows.map((r) => r.title_id)),
    ownedCosmetics: new Set(cosmeticRows.rows.map((r) => cosmeticKey(r.cosmetic_type, r.cosmetic_id))),
    streak,
    vibeRank,
    arcadeTier,
    gameStats,
    gamesWithScores: new Set(scoreGames.rows.map((r) => r.game_id)),
  };
}

export async function evaluateAndPersistUnlocks(
  pool: Pool | PoolClient,
  userId: string
): Promise<{ newTitles: string[]; newCosmetics: string[] }> {
  const ctx = await loadUnlockContext(pool, userId);
  const newTitles: string[] = [];
  const newCosmetics: string[] = [];

  for (const title of PROFILE_TITLES) {
    if (ctx.ownedTitleIds.has(title.id)) continue;
    if (titleUnlocked(title, ctx)) {
      await pool.query(
        `INSERT INTO user_titles (user_id, title_id) VALUES ($1::uuid, $2) ON CONFLICT DO NOTHING`,
        [userId, title.id]
      );
      newTitles.push(title.id);
      ctx.ownedTitleIds.add(title.id);
    }
  }

  for (const c of allCosmetics()) {
    const key = cosmeticKey(c.type, c.id);
    if (ctx.ownedCosmetics.has(key)) continue;
    if (cosmeticUnlocked(c, ctx)) {
      await pool.query(
        `INSERT INTO user_unlocked_cosmetics (user_id, cosmetic_type, cosmetic_id)
         VALUES ($1::uuid, $2, $3) ON CONFLICT DO NOTHING`,
        [userId, c.type, c.id]
      );
      newCosmetics.push(key);
    }
  }

  await pool.query(
    `UPDATE user_profiles SET vibe_rank = $2, arcade_tier = $3, updated_at = NOW()
     WHERE user_id = $1::uuid`,
    [userId, ctx.vibeRank, ctx.arcadeTier]
  );

  return { newTitles, newCosmetics };
}

export async function ensureProfileRow(pool: Pool | PoolClient, userId: string): Promise<void> {
  await pool.query(
    `INSERT INTO user_profiles (user_id) VALUES ($1::uuid) ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  );
  for (const title of PROFILE_TITLES.filter((t) => t.defaultOwned)) {
    await pool.query(
      `INSERT INTO user_titles (user_id, title_id) VALUES ($1::uuid, $2) ON CONFLICT DO NOTHING`,
      [userId, title.id]
    );
  }
  for (const c of allCosmetics().filter((x) => x.defaultOwned)) {
    await pool.query(
      `INSERT INTO user_unlocked_cosmetics (user_id, cosmetic_type, cosmetic_id)
       VALUES ($1::uuid, $2, $3) ON CONFLICT DO NOTHING`,
      [userId, c.type, c.id]
    );
  }
  const prof = await pool.query<{ equipped_title_id: string }>(
    `SELECT equipped_title_id FROM user_profiles WHERE user_id = $1::uuid`,
    [userId]
  );
  if (!prof.rows[0]?.equipped_title_id) {
    await pool.query(
      `UPDATE user_profiles SET equipped_title_id = $2 WHERE user_id = $1::uuid`,
      [userId, DEFAULT_TITLE_ID]
    );
  }
}
