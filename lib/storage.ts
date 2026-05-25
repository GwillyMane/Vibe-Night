import { dailyHandcraftedLevelId, dailyPersistKey } from "./levels";
import { offsetSeedDays } from "./daily-seed";
import { getAccountCrashers, setAccountCrashers } from "./persist/accountCache";
import { isAccountMode } from "./persist/accountMode";
import { scheduleAccountCloudSync } from "./persist/cloudSync";

const PREFIX = "vibe-sling:";

function key(k: string) {
  return PREFIX + k;
}

export function loadJson<T>(id: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key(id));
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJson(id: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key(id), JSON.stringify(value));
  } catch {
    /* ignore quota / private mode */
  }
}

export interface RecentScore {
  score: number;
  kind: "handcrafted" | "daily";
  levelId: string;
  seed: string;
  at: string;
  stars: number;
}

export interface LocalLeaderRow {
  username: string;
  score: number;
  scope: "daily" | "weekly" | "alltime";
  createdAt: string;
  /** Optional — score row flair */
  stars?: number;
  levelId?: string;
  seed?: string;
  /** Daily vs handcrafted row label */
  mode?: "daily" | "level";
}

export interface LifetimeCounters {
  /** Fragile / glass / vibe_core breaks (lifetime). */
  glassBreaks: number;
  /** Max bad-vibe targets cleared in a single launch (personal best). */
  bestTargetsOneLaunch: number;
  /** Max structure blocks shattered in a single launch (personal best). */
  bestBlocksOneLaunch: number;
  /** Won at least one level in a single shot. */
  hasOneShotWin: boolean;
  /** Distinct projectile skin ids with at least one win. */
  winSkinsUsed: string[];
  /** Wins at or under par shots. */
  underParWins: number;
}

export interface PersistedState {
  bestByLevel: Record<string, number>;
  bestStarsByLevel: Record<string, number>;
  achievements: string[];
  soundMuted: boolean;
  dailyCompletedDate: string | null;
  dailyBestScore: number;
  recentScore: RecentScore | null;
  /** Local-only leaderboard rows for UI preview */
  localLeaderboard: LocalLeaderRow[];
  /** Distinct handcrafted level ids cleared at least once (win). */
  levelsBeaten: Record<string, boolean>;
  /** Consecutive calendar daily seeds completed (uses `challenge.seed`). */
  dailyStreak: number;
  lastDailyStreakSeed: string | null;
  /** Lifetime stats for goals / collection. */
  lifetimeCounters?: LifetimeCounters;
}

const DEFAULT_LIFETIME: LifetimeCounters = {
  glassBreaks: 0,
  bestTargetsOneLaunch: 0,
  bestBlocksOneLaunch: 0,
  hasOneShotWin: false,
  winSkinsUsed: [],
  underParWins: 0,
};

const DEFAULT_PERSISTED: PersistedState = {
  bestByLevel: {},
  bestStarsByLevel: {},
  achievements: [],
  soundMuted: false,
  dailyCompletedDate: null,
  dailyBestScore: 0,
  recentScore: null,
  localLeaderboard: [],
  levelsBeaten: {},
  dailyStreak: 0,
  lastDailyStreakSeed: null,
  lifetimeCounters: { ...DEFAULT_LIFETIME },
};

function normalizeLifetime(m?: LifetimeCounters): LifetimeCounters {
  return {
    glassBreaks: m?.glassBreaks ?? 0,
    bestTargetsOneLaunch: m?.bestTargetsOneLaunch ?? 0,
    bestBlocksOneLaunch: m?.bestBlocksOneLaunch ?? 0,
    hasOneShotWin: m?.hasOneShotWin ?? false,
    winSkinsUsed: [...new Set(m?.winSkinsUsed ?? [])],
    underParWins: m?.underParWins ?? 0,
  };
}

/** Add fragile/glass/vibe_core breaks to lifetime counter (persists immediately). */
export function addLifetimeGlassBreaks(delta: number): void {
  if (delta <= 0) return;
  const p = loadPersisted();
  p.lifetimeCounters = normalizeLifetime(p.lifetimeCounters);
  p.lifetimeCounters.glassBreaks += delta;
  savePersisted(p);
}

/** Merge win-only lifetime stats into an in-memory `PersistedState` before `savePersisted`. */
export function mergeLifetimeWinStats(
  p: PersistedState,
  opts: {
    maxTargetsOneLaunch: number;
    maxBlocksOneLaunch: number;
    skin: string;
    underPar: boolean;
    oneShotWin: boolean;
  }
): void {
  p.lifetimeCounters = normalizeLifetime(p.lifetimeCounters);
  p.lifetimeCounters.bestTargetsOneLaunch = Math.max(
    p.lifetimeCounters.bestTargetsOneLaunch,
    opts.maxTargetsOneLaunch
  );
  p.lifetimeCounters.bestBlocksOneLaunch = Math.max(
    p.lifetimeCounters.bestBlocksOneLaunch,
    opts.maxBlocksOneLaunch
  );
  if (opts.oneShotWin) p.lifetimeCounters.hasOneShotWin = true;
  if (opts.skin) {
    const s = new Set(p.lifetimeCounters.winSkinsUsed);
    s.add(opts.skin);
    p.lifetimeCounters.winSkinsUsed = [...s];
  }
  if (opts.underPar) p.lifetimeCounters.underParWins += 1;
}

function migrateDailyKeys(merged: PersistedState): void {
  const keys = new Set([...Object.keys(merged.bestByLevel), ...Object.keys(merged.bestStarsByLevel)]);
  for (const key of keys) {
    if (!key.startsWith("daily:")) continue;
    const parts = key.split(":");
    if (parts.length !== 2 || !parts[1]) continue;
    const seed = parts[1];
    const lid = dailyHandcraftedLevelId(seed);
    const nk = dailyPersistKey(seed, lid);
    if (key === nk) continue;
    merged.bestByLevel[nk] = Math.max(merged.bestByLevel[nk] ?? 0, merged.bestByLevel[key] ?? 0);
    merged.bestStarsByLevel[nk] = Math.max(merged.bestStarsByLevel[nk] ?? 0, merged.bestStarsByLevel[key] ?? 0);
    delete merged.bestByLevel[key];
    delete merged.bestStarsByLevel[key];
  }
}

function inferLevelsBeaten(merged: PersistedState): void {
  if (!merged.levelsBeaten) merged.levelsBeaten = {};
  for (const k of Object.keys(merged.bestStarsByLevel)) {
    if (!k.startsWith("lv:")) continue;
    const id = k.slice(3);
    if ((merged.bestStarsByLevel[k] ?? 0) >= 1) merged.levelsBeaten[id] = true;
  }
  for (const k of Object.keys(merged.bestByLevel)) {
    if (!k.startsWith("lv:")) continue;
    const id = k.slice(3);
    if ((merged.bestByLevel[k] ?? 0) > 0) merged.levelsBeaten[id] = true;
  }
}

export function bumpDailyStreak(p: PersistedState, seedDay: string): void {
  if (!p.lastDailyStreakSeed) {
    p.dailyStreak = 1;
  } else if (p.lastDailyStreakSeed === seedDay) {
    /* same calendar challenge — keep streak */
  } else if (seedDay === offsetSeedDays(p.lastDailyStreakSeed, 1)) {
    p.dailyStreak += 1;
  } else {
    p.dailyStreak = 1;
  }
  p.lastDailyStreakSeed = seedDay;
}

export function getDefaultPersisted(): PersistedState {
  return {
    ...DEFAULT_PERSISTED,
    bestByLevel: {},
    bestStarsByLevel: {},
    levelsBeaten: {},
    achievements: [],
    localLeaderboard: [],
    lifetimeCounters: { ...DEFAULT_LIFETIME },
  };
}

function clonePersisted(p: PersistedState): PersistedState {
  return {
    ...p,
    bestByLevel: { ...p.bestByLevel },
    bestStarsByLevel: { ...p.bestStarsByLevel },
    levelsBeaten: { ...p.levelsBeaten },
    achievements: [...p.achievements],
    localLeaderboard: [...p.localLeaderboard],
    lifetimeCounters: normalizeLifetime(p.lifetimeCounters),
  };
}

/** Guest-only read from localStorage (ignores account cache). */
export function loadGuestPersisted(): PersistedState {
  const raw = loadJson<PersistedState>("persisted", DEFAULT_PERSISTED);
  const merged: PersistedState = {
    ...DEFAULT_PERSISTED,
    ...raw,
    bestByLevel: { ...raw.bestByLevel },
    bestStarsByLevel: { ...DEFAULT_PERSISTED.bestStarsByLevel, ...raw.bestStarsByLevel },
    levelsBeaten: { ...DEFAULT_PERSISTED.levelsBeaten, ...(raw.levelsBeaten ?? {}) },
    dailyStreak: raw.dailyStreak ?? 0,
    lastDailyStreakSeed: raw.lastDailyStreakSeed ?? null,
    lifetimeCounters: normalizeLifetime(raw.lifetimeCounters),
  };
  if (merged.bestByLevel.level1 != null && merged.bestByLevel["lv:1"] == null) {
    merged.bestByLevel["lv:1"] = merged.bestByLevel.level1;
  }
  migrateDailyKeys(merged);
  inferLevelsBeaten(merged);
  return merged;
}

export function loadPersisted(): PersistedState {
  if (typeof window !== "undefined" && isAccountMode()) {
    const cached = getAccountCrashers();
    if (cached) return clonePersisted(cached);
    return getDefaultPersisted();
  }
  return loadGuestPersisted();
}

export function savePersisted(p: PersistedState): void {
  if (typeof window !== "undefined" && isAccountMode()) {
    setAccountCrashers(clonePersisted(p));
    scheduleAccountCloudSync(p);
    return;
  }
  saveJson("persisted", p);
}

export function pushLocalLeaderRow(row: Omit<LocalLeaderRow, "createdAt"> & { createdAt?: string }): void {
  const p = loadPersisted();
  const full: LocalLeaderRow = {
    ...row,
    createdAt: row.createdAt ?? new Date().toISOString(),
  };
  p.localLeaderboard = [full, ...p.localLeaderboard].slice(0, 50);
  savePersisted(p);
}
