import { earnedCrashersSlugs } from "@/lib/achievements";
import type { GameId } from "@/lib/games/catalog";
import { earnedCatchSlugs } from "@/lib/catch-a-vibe/catchAchievements";
import type { CatchPersisted } from "@/lib/catch-a-vibe/catchStorage";
import { earnedShiftSlugs } from "@/lib/vibe-shift/shiftAchievements";
import { earnedLuckySlugs } from "@/lib/lucky-vibes/luckyAchievements";
import type { LuckyPersisted } from "@/lib/lucky-vibes/luckyStorage";
import type { ShiftPersisted } from "@/lib/vibe-shift/shiftStorage";
import { earnedGardenSlugs } from "@/lib/vibe-garden/gardenAchievements";
import type { GardenPersisted } from "@/lib/vibe-garden/gardenStorage";
import { earnedMergeSlugs } from "@/lib/vibe-merge/mergeAchievements";
import type { MergePersisted } from "@/lib/vibe-merge/mergeStorage";
import type { PersistedState } from "@/lib/storage";
import { DEFAULT_MERGE_BACKGROUND_ID } from "@/lib/vibe-merge/mergeBackgrounds";
import { achievementKey } from "./catalog";
import type { GameStatsJson } from "./types";

export interface CrashersProgressHints {
  levelsCleared: number;
  maxStars: number;
  dailyCompleted: boolean;
}

function mergeFromStats(s: GameStatsJson): MergePersisted {
  return {
    bestClassic: s.bestClassic ?? 0,
    bestDaily: s.bestDaily ?? 0,
    bestDailySeed: null,
    highestTierEver: s.highestTierEver ?? 1,
    totalMerges: s.totalMerges ?? 0,
    maxCombo: s.maxCombo ?? 0,
    achievements: [],
    soundMuted: false,
    dailyCompletedDate: null,
    playBackgroundId: DEFAULT_MERGE_BACKGROUND_ID,
  };
}

function gardenFromStats(s: GameStatsJson): GardenPersisted {
  return {
    soundMuted: false,
    bestClassic: s.bestClassic ?? 0,
    bestDaily: s.bestDaily ?? 0,
    achievements: [],
    playBackgroundId: DEFAULT_MERGE_BACKGROUND_ID,
    stats: {
      runs: s.runs ?? 0,
      totalPlants: s.totalPlants ?? 0,
      maxBloomChain: s.maxBloomChain ?? 0,
      bestCleansesInRun: s.bestCleansesInRun ?? 0,
      cleanses: s.cleanses ?? 0,
      goldBlooms: s.goldBlooms ?? 0,
    },
    unlockedThemes: ["default"],
  };
}

function shiftFromStats(s: GameStatsJson): ShiftPersisted {
  return {
    soundMuted: false,
    bestClassic: s.bestClassic ?? 0,
    bestDaily: s.bestDaily ?? 0,
    achievements: [],
    playBackgroundId: DEFAULT_MERGE_BACKGROUND_ID,
    stats: {
      runs: s.runs ?? 0,
      classicWins: s.classicWins ?? 0,
      dailyPlays: s.dailyPlays ?? 0,
      totalClears: s.totalClears ?? 0,
      maxCascade: s.maxCascade ?? 0,
      bestLevelReached: s.bestLevelReached ?? 0,
    },
  };
}

function luckyFromStats(s: GameStatsJson): LuckyPersisted {
  return {
    soundMuted: false,
    bestClassic: s.bestClassic ?? 0,
    bestDaily: s.bestDaily ?? 0,
    achievements: [],
    playBackgroundId: DEFAULT_MERGE_BACKGROUND_ID,
    stats: {
      runs: s.runs ?? 0,
      dailyPlays: s.dailyPlays ?? 0,
      totalSpins: s.totalSpins ?? 0,
      totalLineWins: s.totalLineWins ?? 0,
      luckySpinsTriggered: s.luckySpinsTriggered ?? 0,
      vibeLockTriggered: s.vibeLockTriggered ?? 0,
      grandVibes: s.grandVibes ?? 0,
      bestSingleSpin: s.bestSingleSpin ?? 0,
      bestStreak: s.bestStreak ?? 0,
      maxMultiplier: s.maxMultiplier ?? 0,
    },
  };
}

function catchFromStats(s: GameStatsJson): CatchPersisted {
  return {
    soundMuted: false,
    bestClassic: s.bestClassic ?? 0,
    bestDaily: s.bestDaily ?? 0,
    achievements: [],
    playBackgroundId: DEFAULT_MERGE_BACKGROUND_ID,
    stats: {
      runs: s.runs ?? 0,
      totalCatches: s.totalCatches ?? 0,
      maxCombo: s.maxCombo ?? 0,
      maxBloomChain: s.maxBloomChain ?? s.bloomChains ?? 0,
      bestBadDodgedInRun: s.bestBadDodgedInRun ?? 0,
      badDodged: s.badDodged ?? 0,
      goldenCatches: s.goldenCatches ?? 0,
      hasGoldenCascade: Boolean(s.hasGoldenCascade),
    },
  };
}

function crashersFromStats(s: GameStatsJson, hints: CrashersProgressHints): PersistedState {
  const levelsBeaten: Record<string, boolean> = {};
  for (let i = 1; i <= hints.levelsCleared; i++) {
    levelsBeaten[String(i)] = true;
  }
  return {
    bestByLevel: {},
    bestStarsByLevel: {},
    achievements: [],
    soundMuted: false,
    dailyCompletedDate: hints.dailyCompleted ? "synced" : null,
    dailyBestScore: 0,
    recentScore: null,
    localLeaderboard: [],
    levelsBeaten,
    dailyStreak: 0,
    lastDailyStreakSeed: null,
    lifetimeCounters: {
      glassBreaks: s.glassBreaks ?? s.structuresDestroyed ?? 0,
      bestTargetsOneLaunch: s.bestTargetsOneLaunch ?? 0,
      bestBlocksOneLaunch: s.bestBlocksOneLaunch ?? 0,
      hasOneShotWin: Boolean(s.hasOneShotWin),
      winSkinsUsed: [],
      underParWins: 0,
    },
  };
}

/** Infer earned badge keys from synced game stats + crashers level hints. */
export function inferEarnedAchievementKeys(
  storedKeys: Iterable<string>,
  gameStats: Record<string, GameStatsJson>,
  crashersHints: CrashersProgressHints
): Set<string> {
  const keys = new Set(storedKeys);

  const crashers = gameStats["vibe-crashers"];
  if (crashers || crashersHints.levelsCleared > 0) {
    for (const slug of earnedCrashersSlugs(crashersFromStats(crashers ?? {}, crashersHints))) {
      keys.add(achievementKey("vibe-crashers", slug));
    }
  }

  const merge = gameStats["vibe-merge"];
  if (merge) {
    for (const slug of earnedMergeSlugs(mergeFromStats(merge))) {
      keys.add(achievementKey("vibe-merge", slug));
    }
  }

  const garden = gameStats["vibe-garden"];
  if (garden) {
    for (const slug of earnedGardenSlugs(gardenFromStats(garden))) {
      keys.add(achievementKey("vibe-garden", slug));
    }
  }

  const catchGame = gameStats["catch-a-vibe"];
  if (catchGame) {
    for (const slug of earnedCatchSlugs(catchFromStats(catchGame))) {
      keys.add(achievementKey("catch-a-vibe", slug));
    }
  }

  const shiftGame = gameStats["vibe-shift"];
  if (shiftGame) {
    for (const slug of earnedShiftSlugs(shiftFromStats(shiftGame))) {
      keys.add(achievementKey("vibe-shift", slug));
    }
  }

  const luckyGame = gameStats["lucky-vibes"];
  if (luckyGame) {
    for (const slug of earnedLuckySlugs(luckyFromStats(luckyGame))) {
      keys.add(achievementKey("lucky-vibes", slug));
    }
  }

  return keys;
}

export function slugsToSyncByGame(keys: Set<string>): Record<GameId, string[]> {
  const out: Record<GameId, string[]> = {
    "vibe-crashers": [],
    "vibe-merge": [],
    "vibe-garden": [],
    "catch-a-vibe": [],
    "vibe-shift": [],
    "lucky-vibes": [],
  };
  for (const key of keys) {
    const i = key.indexOf(":");
    if (i <= 0) continue;
    const gameId = key.slice(0, i) as GameId;
    const slug = key.slice(i + 1);
    if (out[gameId]) out[gameId].push(slug);
  }
  return out;
}
