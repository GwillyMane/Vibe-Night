import { finalizeBadgeRows } from "@/lib/arcade/badgeProgress";
import type { BadgeRow } from "@/lib/arcade/badgeTypes";
import type { PersistedState } from "./storage";
import { savePersisted } from "./storage";

export type AchievementTier = "bronze" | "silver" | "gold" | "cosmic";

export interface AchievementDef {
  slug: string;
  title: string;
  description: string;
  tier: AchievementTier;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    slug: "first-launch",
    title: "FIRST LAUNCH",
    description: "Send your first good-vibe shot.",
    tier: "bronze",
  },
  {
    slug: "first-clear",
    title: "FIRST CRASH",
    description: "Clear every bad-vibe target in a run.",
    tier: "bronze",
  },
  {
    slug: "five-clear",
    title: "FIVE CLEAR",
    description: "Beat five different handcrafted levels.",
    tier: "silver",
  },
  {
    slug: "combo-cleanse",
    title: "COMBO CLEANSE",
    description: "Clear two or more targets from one launch.",
    tier: "silver",
  },
  {
    slug: "daily-viber",
    title: "DAILY CRASHER",
    description: "Complete today's daily layout.",
    tier: "silver",
  },
  {
    slug: "three-star-vibe",
    title: "PERFECT CRASH",
    description: "Earn three stars on any level.",
    tier: "gold",
  },
  {
    slug: "one-shot-wonder",
    title: "CROWNED CRASH",
    description: "Win a level using a single launch.",
    tier: "gold",
  },
  {
    slug: "ten-clear",
    title: "TEN CLEAR",
    description: "Beat ten different handcrafted levels.",
    tier: "gold",
  },
  {
    slug: "structure-breaker",
    title: "STRUCTURE BREAKER",
    description: "Shatter five or more structure pieces in one launch.",
    tier: "gold",
  },
  {
    slug: "full-tour",
    title: "FULL TOUR",
    description: "Clear all 20 handcrafted levels.",
    tier: "cosmic",
  },
];

export interface AchievementCheckInput {
  owned: Set<string>;
  didLaunch: boolean;
  didWinRun: boolean;
  shotsUsedThisWin: number;
  bestStarsThisSession: number;
  completedDailyThisRun: boolean;
  maxTargetsOneLaunch: number;
  maxBlocksOneLaunch: number;
  levelsBeatenCount: number;
  dailyStreakAfterBump: number;
  brokeVibeCoreThisWin: boolean;
}

export function achievementBySlug(slug: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find((a) => a.slug === slug);
}

export function evaluateAchievements(input: AchievementCheckInput): AchievementDef[] {
  const newly: AchievementDef[] = [];
  const tryUnlock = (slug: string) => {
    const def = ACHIEVEMENTS.find((a) => a.slug === slug);
    if (def && !input.owned.has(slug) && !newly.some((n) => n.slug === slug)) newly.push(def);
  };

  if (input.didLaunch) tryUnlock("first-launch");
  if (input.didWinRun) tryUnlock("first-clear");
  if (input.levelsBeatenCount >= 5) tryUnlock("five-clear");
  if (input.levelsBeatenCount >= 10) tryUnlock("ten-clear");
  if (input.levelsBeatenCount >= 20) tryUnlock("full-tour");
  if (input.didWinRun && input.shotsUsedThisWin <= 1) tryUnlock("one-shot-wonder");
  if (input.bestStarsThisSession >= 3) tryUnlock("three-star-vibe");
  if (input.completedDailyThisRun) tryUnlock("daily-viber");
  if (input.maxTargetsOneLaunch >= 2) tryUnlock("combo-cleanse");
  if (input.maxBlocksOneLaunch >= 5) tryUnlock("structure-breaker");

  return newly;
}

function levelsBeatenCount(p: PersistedState): number {
  return Object.values(p.levelsBeaten ?? {}).filter(Boolean).length;
}

function maxStars(p: PersistedState): number {
  return Math.max(0, ...Object.values(p.bestStarsByLevel ?? {}));
}

/** Infer earned badges from saved stats (handles legacy saves missing achievement slugs). */
export function earnedCrashersSlugs(p: PersistedState): Set<string> {
  const lc = p.lifetimeCounters;
  const beaten = levelsBeatenCount(p);
  const earned = new Set<string>();

  if (beaten >= 1 || maxStars(p) >= 1) earned.add("first-clear");
  if (beaten >= 5) earned.add("five-clear");
  if (beaten >= 10) earned.add("ten-clear");
  if (beaten >= 20) earned.add("full-tour");
  if ((lc?.bestTargetsOneLaunch ?? 0) >= 2) earned.add("combo-cleanse");
  if (p.dailyCompletedDate) earned.add("daily-viber");
  if (maxStars(p) >= 3) earned.add("three-star-vibe");
  if (lc?.hasOneShotWin) earned.add("one-shot-wonder");
  if ((lc?.bestBlocksOneLaunch ?? 0) >= 5) earned.add("structure-breaker");

  return earned;
}

export function reconcileCrashersAchievements(p: PersistedState): PersistedState {
  const owned = new Set(p.achievements);
  const earned = earnedCrashersSlugs(p);
  const missing = ACHIEVEMENTS.map((a) => a.slug).filter((slug) => earned.has(slug) && !owned.has(slug));
  if (!missing.length) return p;
  const next = { ...p, achievements: [...p.achievements, ...missing] };
  savePersisted(next);
  return next;
}

export function buildCrashersBadgeRows(p: PersistedState): BadgeRow[] {
  const owned = new Set(p.achievements);
  const lc = p.lifetimeCounters;
  const beaten = levelsBeatenCount(p);
  const earned = earnedCrashersSlugs(p);

  const row = (def: AchievementDef, current: number, target: number): BadgeRow => ({
    ...def,
    unlocked: owned.has(def.slug) || earned.has(def.slug),
    current,
    target,
  });

  return finalizeBadgeRows([
    row(ACHIEVEMENTS[0], owned.has("first-launch") || earned.has("first-launch") ? 1 : 0, 1),
    row(ACHIEVEMENTS[1], beaten >= 1 ? 1 : 0, 1),
    row(ACHIEVEMENTS[2], beaten, 5),
    row(ACHIEVEMENTS[3], lc?.bestTargetsOneLaunch ?? 0, 2),
    row(ACHIEVEMENTS[4], p.dailyCompletedDate ? 1 : 0, 1),
    row(ACHIEVEMENTS[5], maxStars(p), 3),
    row(ACHIEVEMENTS[6], lc?.hasOneShotWin ? 1 : 0, 1),
    row(ACHIEVEMENTS[7], beaten, 10),
    row(ACHIEVEMENTS[8], lc?.bestBlocksOneLaunch ?? 0, 5),
    row(ACHIEVEMENTS[9], beaten, 20),
  ]);
}
