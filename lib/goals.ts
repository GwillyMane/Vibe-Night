import type { PersistedState } from "./storage";

export interface GoalDef {
  id: string;
  title: string;
  description: string;
  target: number;
  rewardLabel: string;
  /** 0..target */
  progress: (p: PersistedState) => number;
}

function levelsClearedCount(p: PersistedState): number {
  return Object.keys(p.levelsBeaten ?? {}).filter((id) => p.levelsBeaten[id]).length;
}

function totalStars(p: PersistedState): number {
  let s = 0;
  for (const k of Object.keys(p.bestStarsByLevel)) {
    if (k.startsWith("lv:")) s += p.bestStarsByLevel[k] ?? 0;
  }
  return s;
}

export const GOALS: GoalDef[] = [
  {
    id: "clear-1",
    title: "FIRST CLEAR",
    description: "Clear any handcrafted level.",
    target: 1,
    rewardLabel: "Bronze vibe",
    progress: (p) => Math.min(levelsClearedCount(p), 1),
  },
  {
    id: "clear-5",
    title: "FIVE CRASHES",
    description: "Clear 5 different levels.",
    target: 5,
    rewardLabel: "Silver streak",
    progress: (p) => Math.min(levelsClearedCount(p), 5),
  },
  {
    id: "clear-10",
    title: "TEN CRASHES",
    description: "Clear 10 different levels.",
    target: 10,
    rewardLabel: "Club regular",
    progress: (p) => Math.min(levelsClearedCount(p), 10),
  },
  {
    id: "clear-20",
    title: "FULL TOUR",
    description: "Clear all 20 handcrafted levels.",
    target: 20,
    rewardLabel: "Gold crown",
    progress: (p) => Math.min(levelsClearedCount(p), 20),
  },
  {
    id: "stars-10",
    title: "STAR COLLECTOR",
    description: "Earn 10 total stars across levels.",
    target: 10,
    rewardLabel: "Glow trail",
    progress: (p) => Math.min(totalStars(p), 10),
  },
  {
    id: "stars-30",
    title: "CONSTELLATION",
    description: "Earn 30 total stars across levels.",
    target: 30,
    rewardLabel: "Cosmic card",
    progress: (p) => Math.min(totalStars(p), 30),
  },
  {
    id: "one-shot",
    title: "CROWNED SHOT",
    description: "Win a level with a single launch.",
    target: 1,
    rewardLabel: "Crown flair",
    progress: (p) => (p.achievements?.includes("one-shot-wonder") ? 1 : 0),
  },
  {
    id: "daily-once",
    title: "DAILY CRASHER",
    description: "Complete a Daily Crash run.",
    target: 1,
    rewardLabel: "Daily badge",
    progress: (p) => (p.achievements?.includes("daily-viber") ? 1 : 0),
  },
  {
    id: "glass-25",
    title: "GLASS BREAKER",
    description: "Shatter 25 fragile or glass structure pieces (lifetime).",
    target: 25,
    rewardLabel: "Shatter FX",
    progress: (p) => Math.min(p.lifetimeCounters?.glassBreaks ?? 0, 25),
  },
  {
    id: "combo-3",
    title: "CHAIN CLEANER",
    description: "Clear 3 bad vibes in one launch (best ever).",
    target: 1,
    rewardLabel: "Combo pulse",
    progress: (p) => ((p.lifetimeCounters?.bestTargetsOneLaunch ?? 0) >= 3 ? 1 : 0),
  },
  {
    id: "skins-3",
    title: "VIBE ROTATION",
    description: "Win using 3 different projectile looks.",
    target: 3,
    rewardLabel: "Collector ring",
    progress: (p) => Math.min(p.lifetimeCounters?.winSkinsUsed?.length ?? 0, 3),
  },
  {
    id: "under-par",
    title: "TIGHT LINES",
    description: "Win 5 runs at or under par shots.",
    target: 5,
    rewardLabel: "Par master",
    progress: (p) => Math.min(p.lifetimeCounters?.underParWins ?? 0, 5),
  },
];

export function snapshotGoalProgress(p: PersistedState): Record<string, number> {
  const o: Record<string, number> = {};
  for (const g of GOALS) {
    o[g.id] = g.progress(p);
  }
  return o;
}

export function newlyCompletedGoalTitles(before: Record<string, number>, p: PersistedState): string[] {
  return newlyCompletedGoals(before, p).map((x) => x.title);
}

export function newlyCompletedGoals(
  before: Record<string, number>,
  p: PersistedState
): { id: string; title: string }[] {
  const out: { id: string; title: string }[] = [];
  for (const g of GOALS) {
    const prev = before[g.id] ?? 0;
    const now = g.progress(p);
    if (now >= g.target && prev < g.target) out.push({ id: g.id, title: g.title });
  }
  return out;
}
