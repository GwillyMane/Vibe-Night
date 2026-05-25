import { loadMergePersisted } from "@/lib/vibe-merge/mergeStorage";
import { loadGardenPersisted } from "@/lib/vibe-garden/gardenStorage";
import { loadCatchPersisted } from "@/lib/catch-a-vibe/catchStorage";
import { loadShiftPersisted } from "@/lib/vibe-shift/shiftStorage";
import { loadLuckyPersisted } from "@/lib/lucky-vibes/luckyStorage";
import type { GameStatsJson } from "./types";

export type ArcadeGameSyncPayload = {
  achievements: string[];
  stats: GameStatsJson;
};

export type FullProgressSyncBody = {
  vibeCrashers?: unknown;
  vibeMerge?: ArcadeGameSyncPayload;
  vibeGarden?: ArcadeGameSyncPayload;
  catchAVibe?: ArcadeGameSyncPayload;
  vibeShift?: ArcadeGameSyncPayload;
  luckyVibes?: ArcadeGameSyncPayload;
  nightStreak?: { currentStreak: number; longestStreak: number; lastPlayDate: string | null };
};

export function buildMergeSyncPayload(): ArcadeGameSyncPayload {
  const p = loadMergePersisted();
  return {
    achievements: [...p.achievements],
    stats: {
      bestClassic: p.bestClassic,
      bestDaily: p.bestDaily,
      highestTierEver: p.highestTierEver,
      totalMerges: p.totalMerges,
      maxCombo: p.maxCombo,
    },
  };
}

export function buildGardenSyncPayload(): ArcadeGameSyncPayload {
  const p = loadGardenPersisted();
  return {
    achievements: [...p.achievements],
    stats: {
      bestClassic: p.bestClassic,
      bestDaily: p.bestDaily,
      totalPlants: p.stats.totalPlants,
      maxBloomChain: p.stats.maxBloomChain,
      bestCleansesInRun: p.stats.bestCleansesInRun,
      cleanses: p.stats.cleanses,
      goldBlooms: p.stats.goldBlooms,
      runs: p.stats.runs,
      zenParticipation: p.stats.runs > 0 ? 1 : 0,
    },
  };
}

export function buildCatchSyncPayload(): ArcadeGameSyncPayload {
  const p = loadCatchPersisted();
  return {
    achievements: [...p.achievements],
    stats: {
      bestClassic: p.bestClassic,
      bestDaily: p.bestDaily,
      totalCatches: p.stats.totalCatches,
      maxCombo: p.stats.maxCombo,
      maxBloomChain: p.stats.maxBloomChain,
      bloomChains: p.stats.maxBloomChain,
      bestBadDodgedInRun: p.stats.bestBadDodgedInRun,
      badDodged: p.stats.badDodged,
      goldenCatches: p.stats.goldenCatches,
      hasGoldenCascade: p.stats.hasGoldenCascade,
      runs: p.stats.runs,
      zenParticipation: p.stats.runs > 0 ? 1 : 0,
    },
  };
}

export function buildNightStreakLocal(): FullProgressSyncBody["nightStreak"] {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem("vibe-night:streak");
    if (!raw) return { currentStreak: 0, longestStreak: 0, lastPlayDate: null };
    return JSON.parse(raw) as FullProgressSyncBody["nightStreak"];
  } catch {
    return { currentStreak: 0, longestStreak: 0, lastPlayDate: null };
  }
}

export function buildShiftSyncPayload(): ArcadeGameSyncPayload {
  const p = loadShiftPersisted();
  return {
    achievements: [...p.achievements],
    stats: {
      bestClassic: p.bestClassic,
      bestDaily: p.bestDaily,
      runs: p.stats.runs,
      classicWins: p.stats.classicWins,
      dailyPlays: p.stats.dailyPlays,
      totalClears: p.stats.totalClears,
      maxCascade: p.stats.maxCascade,
      bestLevelReached: p.stats.bestLevelReached,
    },
  };
}

export function buildLuckySyncPayload(): ArcadeGameSyncPayload {
  const p = loadLuckyPersisted();
  return {
    achievements: [...p.achievements],
    stats: {
      bestClassic: p.bestClassic,
      bestDaily: p.bestDaily,
      runs: p.stats.runs,
      dailyPlays: p.stats.dailyPlays,
      totalSpins: p.stats.totalSpins,
      totalLineWins: p.stats.totalLineWins,
      luckySpinsTriggered: p.stats.luckySpinsTriggered,
      vibeLockTriggered: p.stats.vibeLockTriggered,
      grandVibes: p.stats.grandVibes,
      bestSingleSpin: p.stats.bestSingleSpin,
      bestStreak: p.stats.bestStreak,
      maxMultiplier: p.stats.maxMultiplier,
    },
  };
}

export function buildAllGamesSyncExtras(): Pick<FullProgressSyncBody, "vibeMerge" | "vibeGarden" | "catchAVibe" | "vibeShift" | "luckyVibes" | "nightStreak"> {
  return {
    vibeMerge: buildMergeSyncPayload(),
    vibeGarden: buildGardenSyncPayload(),
    catchAVibe: buildCatchSyncPayload(),
    vibeShift: buildShiftSyncPayload(),
    luckyVibes: buildLuckySyncPayload(),
    nightStreak: buildNightStreakLocal(),
  };
}
