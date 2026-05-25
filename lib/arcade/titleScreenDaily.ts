import type { GameId } from "@/lib/games/catalog";
import { readHubGameStats } from "./hubStats";
import { getNightStreak } from "./nightStreak";

export interface TitleDailyStats {
  dailySeed: string;
  bestDaily: number;
  streak: number;
}

/** Client-side daily hero stats for arcade title screens. */
export function readTitleDailyStats(gameId: GameId): TitleDailyStats {
  const { dailyBest, dailySeed } = readHubGameStats(gameId);
  return {
    dailySeed,
    bestDaily: dailyBest,
    streak: getNightStreak().currentStreak,
  };
}
