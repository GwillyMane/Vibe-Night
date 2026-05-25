import { finalizeBadgeRows } from "@/lib/arcade/badgeProgress";
import type { BadgeRow } from "@/lib/arcade/badgeTypes";
import type { CatchPersisted } from "./catchStorage";
import { saveCatchPersisted } from "./catchStorage";

export interface CatchAchievementDef {
  slug: string;
  title: string;
  description: string;
  tier: "bronze" | "silver" | "gold" | "cosmic";
  condition: (s: CatchPersisted, run: RunStats) => boolean;
}

export interface RunStats {
  score: number;
  maxCombo: number;
  bloomChains: number;
  badDodged: number;
  goldenCatches: number;
  catches: number;
}

export const CATCH_ACHIEVEMENTS: CatchAchievementDef[] = [
  {
    slug: "first-catch",
    title: "FIRST CATCH",
    description: "Catch your first vibe.",
    tier: "bronze",
    condition: (_, r) => r.catches >= 1,
  },
  {
    slug: "zen-flow",
    title: "ZEN FLOW",
    description: "Catch 50 vibes in zen mode.",
    tier: "bronze",
    condition: (p) => p.stats.totalCatches >= 50,
  },
  {
    slug: "bad-dodger",
    title: "BAD VIBE DODGER",
    description: "Let 5 Bad Vibes Guys fly past in one run.",
    tier: "silver",
    condition: (_, r) => r.badDodged >= 5,
  },
  {
    slug: "perfect-wave",
    title: "PERFECT WAVE",
    description: "Reach a 10 catch combo.",
    tier: "silver",
    condition: (_, r) => r.maxCombo >= 10,
  },
  {
    slug: "bloom-frenzy",
    title: "BLOOM FRENZY",
    description: "Trigger 5 bloom chains in one run.",
    tier: "silver",
    condition: (_, r) => r.bloomChains >= 5,
  },
  {
    slug: "golden-cascade",
    title: "GOLDEN CASCADE",
    description: "Trigger a golden cascade.",
    tier: "gold",
    condition: (_, r) => r.goldenCatches >= 1 && r.bloomChains >= 1,
  },
  {
    slug: "catch-combo-15",
    title: "RIDE THE WAVE",
    description: "Reach a 15 catch combo.",
    tier: "gold",
    condition: (_, r) => r.maxCombo >= 15,
  },
  {
    slug: "catch-score-5k",
    title: "VIBETOWN BALLER",
    description: "Score 5,000 in classic mode.",
    tier: "gold",
    condition: (_, r) => r.score >= 5000,
  },
  {
    slug: "combo-25",
    title: "COMBO ×25",
    description: "Reach a 25 catch combo.",
    tier: "cosmic",
    condition: (_, r) => r.maxCombo >= 25,
  },
  {
    slug: "legendary-catch",
    title: "LEGENDARY CATCH",
    description: "Score 8,000 in classic mode.",
    tier: "cosmic",
    condition: (_, r) => r.score >= 8000,
  },
];

export function evaluateCatchAchievements(
  persisted: CatchPersisted,
  run: RunStats
): CatchAchievementDef[] {
  const owned = new Set(persisted.achievements);
  return CATCH_ACHIEVEMENTS.filter((a) => !owned.has(a.slug) && a.condition(persisted, run));
}

export function earnedCatchSlugs(p: CatchPersisted): Set<string> {
  const s = p.stats;
  const earned = new Set<string>();
  if (s.totalCatches >= 1) earned.add("first-catch");
  if (s.totalCatches >= 50) earned.add("zen-flow");
  if (s.bestBadDodgedInRun >= 5) earned.add("bad-dodger");
  if (s.maxCombo >= 10) earned.add("perfect-wave");
  if (s.maxBloomChain >= 5) earned.add("bloom-frenzy");
  if (s.hasGoldenCascade) earned.add("golden-cascade");
  if (s.maxCombo >= 15) earned.add("catch-combo-15");
  if (p.bestClassic >= 5000) earned.add("catch-score-5k");
  if (s.maxCombo >= 25) earned.add("combo-25");
  if (p.bestClassic >= 8000) earned.add("legendary-catch");
  return earned;
}

export function reconcileCatchAchievements(p: CatchPersisted): CatchPersisted {
  const owned = new Set(p.achievements);
  const earned = earnedCatchSlugs(p);
  const missing = CATCH_ACHIEVEMENTS.map((a) => a.slug).filter((slug) => earned.has(slug) && !owned.has(slug));
  if (!missing.length) return p;
  const next = { ...p, achievements: [...p.achievements, ...missing] };
  saveCatchPersisted(next);
  return next;
}

export function buildCatchBadgeRows(p: CatchPersisted): BadgeRow[] {
  const owned = new Set(p.achievements);
  const earned = earnedCatchSlugs(p);
  const s = p.stats;

  const row = (def: CatchAchievementDef, current: number, target: number): BadgeRow => ({
    slug: def.slug,
    title: def.title,
    description: def.description,
    tier: def.tier,
    unlocked: owned.has(def.slug) || earned.has(def.slug),
    current,
    target,
  });

  return finalizeBadgeRows([
    row(CATCH_ACHIEVEMENTS[0], s.totalCatches, 1),
    row(CATCH_ACHIEVEMENTS[1], s.totalCatches, 50),
    row(CATCH_ACHIEVEMENTS[2], s.bestBadDodgedInRun, 5),
    row(CATCH_ACHIEVEMENTS[3], s.maxCombo, 10),
    row(CATCH_ACHIEVEMENTS[4], s.maxBloomChain, 5),
    row(CATCH_ACHIEVEMENTS[5], s.hasGoldenCascade ? 1 : 0, 1),
    row(CATCH_ACHIEVEMENTS[6], s.maxCombo, 15),
    row(CATCH_ACHIEVEMENTS[7], p.bestClassic, 5000),
    row(CATCH_ACHIEVEMENTS[8], s.maxCombo, 25),
    row(CATCH_ACHIEVEMENTS[9], p.bestClassic, 8000),
  ]);
}
