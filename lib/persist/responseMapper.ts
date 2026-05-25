import type { AccountProgressResponse } from "./accountCache";

/** Normalize progress API responses from `/api/progress/me` or `/api/progress/sync`. */
export function mapProgressApiResponse(raw: Record<string, unknown>): AccountProgressResponse {
  const gameStatsRaw = raw.gameStats as Array<{ gameId: string; statsJson: Record<string, unknown> }> | undefined;
  return {
    levelProgress: (raw.levelProgress as AccountProgressResponse["levelProgress"]) ?? [],
    dailyProgress: (raw.dailyProgress as AccountProgressResponse["dailyProgress"]) ?? [],
    achievements: ((raw.achievements as Array<{ gameId: string; achievementId: string }>) ?? []).map((a) => ({
      gameId: a.gameId,
      achievementId: a.achievementId,
    })),
    settings: (raw.settings as AccountProgressResponse["settings"]) ?? null,
    gameStats: gameStatsRaw?.map((row) => ({
      gameId: row.gameId,
      statsJson: row.statsJson ?? {},
    })),
  };
}
