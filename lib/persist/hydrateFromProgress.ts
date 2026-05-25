import { DEFAULT_MERGE_BACKGROUND_ID } from "@/lib/vibe-merge/mergeBackgrounds";
import type { CatchPersisted } from "@/lib/catch-a-vibe/catchStorage";
import type { LuckyPersisted } from "@/lib/lucky-vibes/luckyStorage";
import type { ShiftPersisted } from "@/lib/vibe-shift/shiftStorage";
import type { GardenPersisted } from "@/lib/vibe-garden/gardenStorage";
import type { MergePersisted } from "@/lib/vibe-merge/mergeStorage";
import { getDefaultPersisted, type PersistedState } from "@/lib/storage";
import {
  setAccountCatch,
  setAccountShift,
  setAccountLucky,
  setAccountCrashers,
  setAccountGarden,
  setAccountMerge,
  type AccountProgressResponse,
} from "./accountCache";

function achSlugs(data: AccountProgressResponse, gameId: string): string[] {
  return data.achievements.filter((a) => a.gameId === gameId).map((a) => a.achievementId);
}

function statsFor(data: AccountProgressResponse, gameId: string): Record<string, unknown> {
  return data.gameStats?.find((g) => g.gameId === gameId)?.statsJson ?? {};
}

export function hydrateCrashersFromProgress(data: AccountProgressResponse): PersistedState {
  const base = getDefaultPersisted();
  const bestByLevel = { ...base.bestByLevel };
  const bestStarsByLevel = { ...base.bestStarsByLevel };
  const levelsBeaten = { ...base.levelsBeaten };

  for (const row of data.levelProgress) {
    const k = `lv:${row.levelId}`;
    bestByLevel[k] = Math.max(bestByLevel[k] ?? 0, row.bestScore);
    bestStarsByLevel[k] = Math.max(bestStarsByLevel[k] ?? 0, row.bestStars);
    if (row.completed || row.bestStars >= 1) levelsBeaten[row.levelId] = true;
  }

  let dailyBestScore = base.dailyBestScore;
  let dailyCompletedDate = base.dailyCompletedDate;
  for (const row of data.dailyProgress) {
    const k = `daily:${row.dailySeed}:${row.levelId}`;
    bestByLevel[k] = Math.max(bestByLevel[k] ?? 0, row.bestScore);
    bestStarsByLevel[k] = Math.max(bestStarsByLevel[k] ?? 0, row.bestStars);
    if (row.completed || row.bestScore > 0) {
      dailyBestScore = Math.max(dailyBestScore, row.bestScore);
      dailyCompletedDate = row.dailySeed;
    }
  }

  const cs = statsFor(data, "vibe-crashers");
  const lifetimeCounters = {
    glassBreaks: Number(cs.glassBreaks ?? cs.structuresDestroyed ?? 0),
    bestTargetsOneLaunch: Number(cs.bestTargetsOneLaunch ?? 0),
    bestBlocksOneLaunch: Number(cs.bestBlocksOneLaunch ?? 0),
    hasOneShotWin: Boolean(cs.hasOneShotWin),
    winSkinsUsed: Array.isArray(cs.winSkinsUsed) ? (cs.winSkinsUsed as string[]) : [],
    underParWins: Number(cs.underParWins ?? 0),
  };

  return {
    ...base,
    bestByLevel,
    bestStarsByLevel,
    levelsBeaten,
    achievements: achSlugs(data, "vibe-crashers"),
    soundMuted: data.settings?.soundMuted ?? base.soundMuted,
    dailyBestScore,
    dailyCompletedDate,
    lifetimeCounters,
    localLeaderboard: [],
  };
}

export function hydrateMergeFromProgress(data: AccountProgressResponse): MergePersisted {
  const s = statsFor(data, "vibe-merge");
  return {
    bestClassic: Number(s.bestClassic ?? 0),
    bestDaily: Number(s.bestDaily ?? 0),
    bestDailySeed: null,
    highestTierEver: Number(s.highestTierEver ?? 1),
    totalMerges: Number(s.totalMerges ?? 0),
    maxCombo: Number(s.maxCombo ?? 0),
    achievements: achSlugs(data, "vibe-merge"),
    soundMuted: data.settings?.soundMuted ?? false,
    dailyCompletedDate: null,
    playBackgroundId: DEFAULT_MERGE_BACKGROUND_ID,
  };
}

export function hydrateGardenFromProgress(data: AccountProgressResponse): GardenPersisted {
  const s = statsFor(data, "vibe-garden");
  return {
    soundMuted: data.settings?.soundMuted ?? false,
    bestClassic: Number(s.bestClassic ?? 0),
    bestDaily: Number(s.bestDaily ?? 0),
    achievements: achSlugs(data, "vibe-garden"),
    playBackgroundId: DEFAULT_MERGE_BACKGROUND_ID,
    stats: {
      runs: Number(s.runs ?? 0),
      totalPlants: Number(s.totalPlants ?? 0),
      maxBloomChain: Number(s.maxBloomChain ?? 0),
      bestCleansesInRun: Number(s.bestCleansesInRun ?? 0),
      cleanses: Number(s.cleanses ?? 0),
      goldBlooms: Number(s.goldBlooms ?? 0),
    },
    unlockedThemes: ["default"],
  };
}

export function hydrateCatchFromProgress(data: AccountProgressResponse): CatchPersisted {
  const s = statsFor(data, "catch-a-vibe");
  return {
    soundMuted: data.settings?.soundMuted ?? false,
    bestClassic: Number(s.bestClassic ?? 0),
    bestDaily: Number(s.bestDaily ?? 0),
    achievements: achSlugs(data, "catch-a-vibe"),
    playBackgroundId: DEFAULT_MERGE_BACKGROUND_ID,
    stats: {
      runs: Number(s.runs ?? 0),
      totalCatches: Number(s.totalCatches ?? 0),
      maxCombo: Number(s.maxCombo ?? 0),
      maxBloomChain: Number(s.maxBloomChain ?? s.bloomChains ?? 0),
      bestBadDodgedInRun: Number(s.bestBadDodgedInRun ?? 0),
      badDodged: Number(s.badDodged ?? 0),
      goldenCatches: Number(s.goldenCatches ?? 0),
      hasGoldenCascade: Boolean(s.hasGoldenCascade),
    },
  };
}

export function hydrateShiftFromProgress(data: AccountProgressResponse): ShiftPersisted {
  const s = statsFor(data, "vibe-shift");
  return {
    soundMuted: data.settings?.soundMuted ?? false,
    bestClassic: Number(s.bestClassic ?? 0),
    bestDaily: Number(s.bestDaily ?? 0),
    achievements: achSlugs(data, "vibe-shift"),
    playBackgroundId: DEFAULT_MERGE_BACKGROUND_ID,
    stats: {
      runs: Number(s.runs ?? 0),
      classicWins: Number(s.classicWins ?? 0),
      dailyPlays: Number(s.dailyPlays ?? 0),
      totalClears: Number(s.totalClears ?? 0),
      maxCascade: Number(s.maxCascade ?? 0),
      bestLevelReached: Number(s.bestLevelReached ?? 0),
    },
  };
}

export function hydrateLuckyFromProgress(data: AccountProgressResponse): LuckyPersisted {
  const s = statsFor(data, "lucky-vibes");
  return {
    soundMuted: data.settings?.soundMuted ?? false,
    bestClassic: Number(s.bestClassic ?? 0),
    bestDaily: Number(s.bestDaily ?? 0),
    achievements: achSlugs(data, "lucky-vibes"),
    playBackgroundId: DEFAULT_MERGE_BACKGROUND_ID,
    stats: {
      runs: Number(s.runs ?? 0),
      dailyPlays: Number(s.dailyPlays ?? 0),
      totalSpins: Number(s.totalSpins ?? 0),
      totalLineWins: Number(s.totalLineWins ?? 0),
      luckySpinsTriggered: Number(s.luckySpinsTriggered ?? 0),
      vibeLockTriggered: Number(s.vibeLockTriggered ?? 0),
      grandVibes: Number(s.grandVibes ?? 0),
      bestSingleSpin: Number(s.bestSingleSpin ?? 0),
      bestStreak: Number(s.bestStreak ?? 0),
      maxMultiplier: Number(s.maxMultiplier ?? 0),
    },
  };
}

export function hydrateAllFromProgressResponse(data: AccountProgressResponse): void {
  setAccountCrashers(hydrateCrashersFromProgress(data));
  setAccountMerge(hydrateMergeFromProgress(data));
  setAccountGarden(hydrateGardenFromProgress(data));
  setAccountCatch(hydrateCatchFromProgress(data));
  setAccountShift(hydrateShiftFromProgress(data));
  setAccountLucky(hydrateLuckyFromProgress(data));
}
