import type { GameId } from "@/lib/games/catalog";
import { GAME_LIBRARY } from "@/lib/games/catalog";
import type { ProfileTitleDef } from "./catalog";
import { achievementKey } from "./catalog";
import type { GameStatsJson, UnlockContext } from "./types";

export const ALL_GAME_IDS: GameId[] = GAME_LIBRARY.map((g) => g.id);

function hasAchievement(ctx: UnlockContext, gameId: string, slug: string): boolean {
  return ctx.achievementKeys.has(achievementKey(gameId as GameId, slug));
}

function maxComboAcrossGames(stats: Record<string, GameStatsJson>): number {
  let max = 0;
  for (const s of Object.values(stats)) {
    max = Math.max(max, s.maxCombo ?? 0);
  }
  return max;
}

function countGamesPlayed(stats: Record<string, GameStatsJson>): number {
  let count = 0;
  for (const gameId of ALL_GAME_IDS) {
    const s = stats[gameId];
    if (!s) continue;
    const participated =
      (s.runs ?? 0) >= 1 ||
      (s.levelsCleared ?? 0) >= 1 ||
      (s.totalMerges ?? 0) >= 1 ||
      (s.totalPlants ?? 0) >= 1 ||
      (s.totalCatches ?? 0) >= 1 ||
      (s.totalClears ?? 0) >= 1 ||
      (s.totalSpins ?? 0) >= 1 ||
      (s.bestClassic ?? 0) > 0 ||
      (s.bestDaily ?? 0) > 0;
    if (participated) count++;
  }
  return count;
}

function countGamesWithZen(stats: Record<string, GameStatsJson>): number {
  let count = 0;
  for (const gameId of ALL_GAME_IDS) {
    if ((stats[gameId]?.zenParticipation ?? 0) >= 1) count++;
  }
  return count;
}

/** Evaluates whether a profile title is unlocked for the given context. */
export function titleUnlocked(title: ProfileTitleDef, ctx: UnlockContext): boolean {
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
    case "gamesPlayed":
      return countGamesPlayed(ctx.gameStats) >= Number(title.unlockParams?.min ?? 6);
    case "zenAllGames":
      return countGamesWithZen(ctx.gameStats) >= Number(title.unlockParams?.min ?? ALL_GAME_IDS.length);
    case "streak":
      return ctx.streak.currentStreak >= Number(title.unlockParams?.days ?? 0);
    case "achievementCount":
      return ctx.achievementKeys.size >= Number(title.unlockParams?.min ?? 0);
    case "passport":
      return ctx.hasPassport;
    default:
      return false;
  }
}

export { countGamesPlayed, countGamesWithZen, maxComboAcrossGames };
