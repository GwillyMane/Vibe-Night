import { finalizeBadgeRows } from "@/lib/arcade/badgeProgress";
import type { BadgeRow } from "@/lib/arcade/badgeTypes";
import { hasSixWayChampion } from "./luckySpinsFeature";
import type { LuckyPersisted } from "./luckyStorage";
import { saveLuckyPersisted } from "./luckyStorage";
import type { WayWin } from "./luckyWays";

export interface LuckyRunStats {
  score: number;
  mode: "classic" | "daily" | "zen";
  luckySpinsTriggered: number;
  vibeLockTriggered: number;
  grandVibe: boolean;
  bestSingleSpin: number;
  maxStreak: number;
  maxMultiplier: number;
  lastWins: WayWin[];
}

export interface LuckyAchievementDef {
  slug: string;
  title: string;
  description: string;
  tier: "bronze" | "silver" | "gold" | "cosmic";
  condition: (p: LuckyPersisted, run: LuckyRunStats) => boolean;
}

export const LUCKY_ACHIEVEMENTS: LuckyAchievementDef[] = [
  {
    slug: "first-pull",
    title: "FIRST SPIN",
    description: "Complete your first run.",
    tier: "bronze",
    condition: (p) => p.stats.runs >= 1,
  },
  {
    slug: "first-way",
    title: "PAYDAY",
    description: "Win any way in a run.",
    tier: "bronze",
    condition: (_, r) => r.lastWins.length > 0 || r.bestSingleSpin > 0,
  },
  {
    slug: "lucky-spins",
    title: "LUCKY SPINS",
    description: "Trigger Lucky Spins once.",
    tier: "bronze",
    condition: (p, r) => p.stats.luckySpinsTriggered >= 1 || r.luckySpinsTriggered >= 1,
  },
  {
    slug: "vibe-lock",
    title: "LOCKED IN",
    description: "Trigger Vibe Lock once.",
    tier: "silver",
    condition: (p, r) => p.stats.vibeLockTriggered >= 1 || r.vibeLockTriggered >= 1,
  },
  {
    slug: "mult-10",
    title: "MULTIPLIER MAD",
    description: "Reach ×10 multiplier in Lucky Spins.",
    tier: "silver",
    condition: (_, r) => r.maxMultiplier >= 10,
  },
  {
    slug: "daily-regular",
    title: "DAILY LUCK",
    description: "Play 5 daily runs.",
    tier: "silver",
    condition: (p) => p.stats.dailyPlays >= 5,
  },
  {
    slug: "champion-hit",
    title: "CHAMPION",
    description: "Land Champion 6-way.",
    tier: "gold",
    condition: (_, r) => hasSixWayChampion(r.lastWins),
  },
  {
    slug: "grand-vibe",
    title: "GRAND VIBE",
    description: "Fill the Vibe Lock grid.",
    tier: "gold",
    condition: (p, r) => p.stats.grandVibes >= 1 || r.grandVibe,
  },
  {
    slug: "daily-4k",
    title: "DAILY HIGH",
    description: "Score 4,000+ on daily.",
    tier: "gold",
    condition: (_, r) => r.mode === "daily" && r.score >= 4000,
  },
  {
    slug: "lucky-legend",
    title: "LUCKY LEGEND",
    description: "Score 10,000+ in classic.",
    tier: "cosmic",
    condition: (_, r) => r.mode === "classic" && r.score >= 10000,
  },
];

export function evaluateLuckyAchievements(
  persisted: LuckyPersisted,
  run: LuckyRunStats
): LuckyAchievementDef[] {
  const owned = new Set(persisted.achievements);
  return LUCKY_ACHIEVEMENTS.filter((a) => !owned.has(a.slug) && a.condition(persisted, run));
}

export function earnedLuckySlugs(p: LuckyPersisted): Set<string> {
  const s = p.stats;
  const earned = new Set<string>();
  if (s.runs >= 1) earned.add("first-pull");
  if (s.totalLineWins >= 1 || s.bestSingleSpin > 0) earned.add("first-way");
  if (s.luckySpinsTriggered >= 1) earned.add("lucky-spins");
  if (s.vibeLockTriggered >= 1) earned.add("vibe-lock");
  if (s.maxMultiplier >= 10) earned.add("mult-10");
  if (s.dailyPlays >= 5) earned.add("daily-regular");
  if (s.grandVibes >= 1) earned.add("grand-vibe");
  if (p.bestDaily >= 4000) earned.add("daily-4k");
  if (p.bestClassic >= 10000) earned.add("lucky-legend");
  return earned;
}

export function reconcileLuckyAchievements(p: LuckyPersisted): LuckyPersisted {
  const owned = new Set(p.achievements);
  const earned = earnedLuckySlugs(p);
  const missing = LUCKY_ACHIEVEMENTS.map((a) => a.slug).filter((slug) => earned.has(slug) && !owned.has(slug));
  if (!missing.length) return p;
  const next = { ...p, achievements: [...p.achievements, ...missing] };
  saveLuckyPersisted(next);
  return next;
}

export function buildLuckyBadgeRows(p: LuckyPersisted): BadgeRow[] {
  const owned = new Set(p.achievements);
  const earned = earnedLuckySlugs(p);
  const s = p.stats;

  const row = (def: LuckyAchievementDef, current: number, target: number): BadgeRow => ({
    slug: def.slug,
    title: def.title,
    description: def.description,
    tier: def.tier,
    unlocked: owned.has(def.slug) || earned.has(def.slug),
    current,
    target,
  });

  return finalizeBadgeRows([
    row(LUCKY_ACHIEVEMENTS[0]!, s.runs, 1),
    row(LUCKY_ACHIEVEMENTS[1]!, s.totalLineWins > 0 ? 1 : 0, 1),
    row(LUCKY_ACHIEVEMENTS[2]!, s.luckySpinsTriggered, 1),
    row(LUCKY_ACHIEVEMENTS[3]!, s.vibeLockTriggered, 1),
    row(LUCKY_ACHIEVEMENTS[4]!, s.maxMultiplier, 10),
    row(LUCKY_ACHIEVEMENTS[5]!, s.dailyPlays, 5),
    row(LUCKY_ACHIEVEMENTS[6]!, 0, 1),
    row(LUCKY_ACHIEVEMENTS[7]!, s.grandVibes, 1),
    row(LUCKY_ACHIEVEMENTS[8]!, p.bestDaily, 4000),
    row(LUCKY_ACHIEVEMENTS[9]!, p.bestClassic, 10000),
  ]);
}
