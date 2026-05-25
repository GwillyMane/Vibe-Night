import { finalizeBadgeRows } from "@/lib/arcade/badgeProgress";
import type { BadgeRow } from "@/lib/arcade/badgeTypes";
import type { ShiftPersisted } from "./shiftStorage";
import { saveShiftPersisted } from "./shiftStorage";
import type { ShiftEndReason } from "./shiftEndReason";

export interface ShiftRunStats {
  score: number;
  level: number;
  totalClears: number;
  maxCascade: number;
  endReason: ShiftEndReason | null;
  mode: "classic" | "daily";
}

export interface ShiftAchievementDef {
  slug: string;
  title: string;
  description: string;
  tier: "bronze" | "silver" | "gold" | "cosmic";
  condition: (s: ShiftPersisted, run: ShiftRunStats) => boolean;
}

export const SHIFT_ACHIEVEMENTS: ShiftAchievementDef[] = [
  {
    slug: "first-shift",
    title: "FIRST SHIFT",
    description: "Complete your first successful shift.",
    tier: "bronze",
    condition: (p) => p.stats.runs >= 1,
  },
  {
    slug: "cascade-3",
    title: "CHAIN REACTION",
    description: "Hit a 3-step cascade in one move.",
    tier: "bronze",
    condition: (_, r) => r.maxCascade >= 3,
  },
  {
    slug: "level-5",
    title: "MIDNIGHT SLIDER",
    description: "Reach level 5 in classic mode.",
    tier: "silver",
    condition: (_, r) => r.level >= 5,
  },
  {
    slug: "daily-regular",
    title: "DAILY SLIDER",
    description: "Play 5 daily boards.",
    tier: "silver",
    condition: (p) => p.stats.dailyPlays >= 5,
  },
  {
    slug: "clear-100",
    title: "MATCH MAKER",
    description: "Clear 100 match groups across all runs.",
    tier: "silver",
    condition: (p) => p.stats.totalClears >= 100,
  },
  {
    slug: "daily-5k",
    title: "DAILY GRIND",
    description: "Score 5,000+ on the daily board.",
    tier: "silver",
    condition: (_, r) => r.mode === "daily" && r.score >= 5000,
  },
  {
    slug: "classic-3k",
    title: "SHIFT SCORER",
    description: "Score 3,000+ in classic mode.",
    tier: "gold",
    condition: (_, r) => r.mode === "classic" && r.score >= 3000,
  },
  {
    slug: "classic-win",
    title: "FULL SHIFT",
    description: "Clear all 10 classic levels.",
    tier: "gold",
    condition: (_, r) => r.endReason === "classic_complete",
  },
  {
    slug: "cascade-5",
    title: "VIBE STORM",
    description: "Hit a 5-step cascade in one move.",
    tier: "gold",
    condition: (_, r) => r.maxCascade >= 5,
  },
  {
    slug: "shift-legend",
    title: "LEGENDARY SHIFT",
    description: "Score 10,000+ in classic mode.",
    tier: "cosmic",
    condition: (_, r) => r.mode === "classic" && r.score >= 10000,
  },
];

export function evaluateShiftAchievements(
  persisted: ShiftPersisted,
  run: ShiftRunStats
): ShiftAchievementDef[] {
  const owned = new Set(persisted.achievements);
  return SHIFT_ACHIEVEMENTS.filter((a) => !owned.has(a.slug) && a.condition(persisted, run));
}

export function earnedShiftSlugs(p: ShiftPersisted): Set<string> {
  const s = p.stats;
  const earned = new Set<string>();
  if (s.runs >= 1) earned.add("first-shift");
  if (s.maxCascade >= 3) earned.add("cascade-3");
  if (s.bestLevelReached >= 5) earned.add("level-5");
  if (s.dailyPlays >= 5) earned.add("daily-regular");
  if (s.totalClears >= 100) earned.add("clear-100");
  if (p.bestDaily >= 5000) earned.add("daily-5k");
  if (p.bestClassic >= 3000) earned.add("classic-3k");
  if (s.classicWins >= 1) earned.add("classic-win");
  if (s.maxCascade >= 5) earned.add("cascade-5");
  if (p.bestClassic >= 10000) earned.add("shift-legend");
  return earned;
}

export function reconcileShiftAchievements(p: ShiftPersisted): ShiftPersisted {
  const owned = new Set(p.achievements);
  const earned = earnedShiftSlugs(p);
  const missing = SHIFT_ACHIEVEMENTS.map((a) => a.slug).filter((slug) => earned.has(slug) && !owned.has(slug));
  if (!missing.length) return p;
  const next = { ...p, achievements: [...p.achievements, ...missing] };
  saveShiftPersisted(next);
  return next;
}

export function buildShiftBadgeRows(p: ShiftPersisted): BadgeRow[] {
  const owned = new Set(p.achievements);
  const earned = earnedShiftSlugs(p);
  const s = p.stats;

  const row = (def: ShiftAchievementDef, current: number, target: number): BadgeRow => ({
    slug: def.slug,
    title: def.title,
    description: def.description,
    tier: def.tier,
    unlocked: owned.has(def.slug) || earned.has(def.slug),
    current,
    target,
  });

  return finalizeBadgeRows([
    row(SHIFT_ACHIEVEMENTS[0]!, s.runs, 1),
    row(SHIFT_ACHIEVEMENTS[1]!, s.maxCascade, 3),
    row(SHIFT_ACHIEVEMENTS[2]!, s.bestLevelReached, 5),
    row(SHIFT_ACHIEVEMENTS[3]!, s.dailyPlays, 5),
    row(SHIFT_ACHIEVEMENTS[4]!, s.totalClears, 100),
    row(SHIFT_ACHIEVEMENTS[5]!, p.bestDaily, 5000),
    row(SHIFT_ACHIEVEMENTS[6]!, p.bestClassic, 3000),
    row(SHIFT_ACHIEVEMENTS[7]!, s.classicWins, 1),
    row(SHIFT_ACHIEVEMENTS[8]!, s.maxCascade, 5),
    row(SHIFT_ACHIEVEMENTS[9]!, p.bestClassic, 10000),
  ]);
}
