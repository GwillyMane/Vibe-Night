import { GOALS, snapshotGoalProgress } from "./goals";
import type { PersistedState } from "./storage";

export type ProgressSyncPayload = {
  levelBests: Record<string, { score: number; stars: number }>;
  dailyBests: Record<string, { seed: string; levelId: string; score: number; stars: number }>;
  achievements: string[];
  goals: Record<string, { progress: number; completed: boolean }>;
  lifetimeCounters: NonNullable<PersistedState["lifetimeCounters"]>;
  selectedProjectile: string | null;
  soundMuted: boolean;
  reducedMotion: boolean | null;
};

export function buildProgressSyncPayload(
  p: PersistedState,
  opts: { selectedProjectile: string | null; soundMuted: boolean; reducedMotion?: boolean | null }
): ProgressSyncPayload {
  const levelBests: Record<string, { score: number; stars: number }> = {};
  const dailyBests: Record<string, { seed: string; levelId: string; score: number; stars: number }> = {};
  for (const [k, sc] of Object.entries(p.bestByLevel)) {
    const st = p.bestStarsByLevel[k] ?? 0;
    if (k.startsWith("lv:")) {
      levelBests[k] = { score: sc, stars: st };
    }
    if (k.startsWith("daily:")) {
      const parts = k.split(":");
      if (parts.length >= 3 && parts[1] && parts[2]) {
        dailyBests[k] = { seed: parts[1], levelId: parts[2], score: sc, stars: st };
      }
    }
  }
  const snap = snapshotGoalProgress(p);
  const goals: Record<string, { progress: number; completed: boolean }> = {};
  for (const g of GOALS) {
    const pr = snap[g.id] ?? 0;
    goals[g.id] = { progress: pr, completed: pr >= g.target };
  }
  const lifetimeCounters = p.lifetimeCounters ?? {
    glassBreaks: 0,
    bestTargetsOneLaunch: 0,
    bestBlocksOneLaunch: 0,
    hasOneShotWin: false,
    winSkinsUsed: [],
    underParWins: 0,
  };
  return {
    levelBests,
    dailyBests,
    achievements: [...p.achievements],
    goals,
    lifetimeCounters: {
      glassBreaks: lifetimeCounters.glassBreaks,
      bestTargetsOneLaunch: lifetimeCounters.bestTargetsOneLaunch,
      bestBlocksOneLaunch: lifetimeCounters.bestBlocksOneLaunch,
      hasOneShotWin: lifetimeCounters.hasOneShotWin,
      winSkinsUsed: [...lifetimeCounters.winSkinsUsed],
      underParWins: lifetimeCounters.underParWins,
    },
    selectedProjectile: opts.selectedProjectile,
    soundMuted: opts.soundMuted,
    reducedMotion: opts.reducedMotion ?? null,
  };
}

export type ServerProgressSnapshot = {
  levelProgress: Array<{
    levelId: string;
    bestScore: number;
    bestStars: number;
    bestShotsUsed: number | null;
    completed: boolean;
    updatedAt: string;
  }>;
  dailyProgress: Array<{
    dailySeed: string;
    levelId: string;
    bestScore: number;
    bestStars: number;
    bestShotsUsed: number | null;
    completed: boolean;
    playedAt: string;
  }>;
  achievements: Array<{ achievementId: string; unlockedAt: string }>;
  settings: { selectedProjectile: string | null; soundMuted: boolean; reducedMotion: boolean | null } | null;
};

export function mergeServerSnapshotIntoPersisted(p: PersistedState, server: ServerProgressSnapshot): PersistedState {
  const bestByLevel = { ...p.bestByLevel };
  const bestStarsByLevel = { ...p.bestStarsByLevel };
  const levelsBeaten = { ...p.levelsBeaten };
  const achSet = new Set(p.achievements);
  for (const row of server.levelProgress) {
    const k = `lv:${row.levelId}`;
    bestByLevel[k] = Math.max(bestByLevel[k] ?? 0, row.bestScore);
    bestStarsByLevel[k] = Math.max(bestStarsByLevel[k] ?? 0, row.bestStars);
    if (row.completed || row.bestStars >= 1) levelsBeaten[row.levelId] = true;
  }
  for (const row of server.dailyProgress) {
    const k = `daily:${row.dailySeed}:${row.levelId}`;
    bestByLevel[k] = Math.max(bestByLevel[k] ?? 0, row.bestScore);
    bestStarsByLevel[k] = Math.max(bestStarsByLevel[k] ?? 0, row.bestStars);
  }
  for (const a of server.achievements) {
    achSet.add(a.achievementId);
  }
  const soundMuted = server.settings?.soundMuted ?? p.soundMuted;
  return {
    ...p,
    bestByLevel,
    bestStarsByLevel,
    levelsBeaten,
    achievements: [...achSet],
    soundMuted,
  };
}
