import { finalizeBadgeRows } from "@/lib/arcade/badgeProgress";
import type { BadgeRow } from "@/lib/arcade/badgeTypes";
import type { GardenPersisted } from "./gardenStorage";
import { saveGardenPersisted } from "./gardenStorage";

export interface GardenAchievementDef {
  slug: string;
  title: string;
  description: string;
  tier: "bronze" | "silver" | "gold" | "cosmic";
  condition: (s: GardenPersisted, run: RunStats) => boolean;
}

export interface RunStats {
  score: number;
  maxChain: number;
  cleanses: number;
  survivalMs: number;
  goldBlooms: number;
}

export const GARDEN_ACHIEVEMENTS: GardenAchievementDef[] = [
  {
    slug: "first-bloom",
    title: "FIRST BLOOM",
    description: "Trigger your first bloom chain.",
    tier: "bronze",
    condition: (_, r) => r.maxChain >= 1,
  },
  {
    slug: "zen-cultivator",
    title: "ZEN CULTIVATOR",
    description: "Plant 20 vibes in zen mode.",
    tier: "bronze",
    condition: (p) => p.stats.totalPlants >= 20,
  },
  {
    slug: "garden-chain-5",
    title: "CHAIN ×5",
    description: "Reach a bloom chain of 5 in one run.",
    tier: "silver",
    condition: (_, r) => r.maxChain >= 5,
  },
  {
    slug: "chain-10",
    title: "CHAIN ×10",
    description: "Reach a bloom chain of 10 in one run.",
    tier: "silver",
    condition: (_, r) => r.maxChain >= 10,
  },
  {
    slug: "corruption-survivor",
    title: "CORRUPTION SURVIVOR",
    description: "Cleanse 3 corrupted vibes in one run.",
    tier: "silver",
    condition: (_, r) => r.cleanses >= 3,
  },
  {
    slug: "golden-ecosystem",
    title: "GOLDEN ECOSYSTEM",
    description: "Trigger a golden bloom.",
    tier: "gold",
    condition: (_, r) => r.goldBlooms >= 1,
  },
  {
    slug: "master-gardener",
    title: "MASTER GARDENER",
    description: "Score 5,000 in classic mode.",
    tier: "gold",
    condition: (_, r) => r.score >= 5000,
  },
  {
    slug: "garden-score-10k",
    title: "VIBE OVERGROWTH",
    description: "Score 10,000 in classic mode.",
    tier: "gold",
    condition: (_, r) => r.score >= 10_000,
  },
  {
    slug: "perfect-stabilization",
    title: "PERFECT STABILIZATION",
    description: "Cleanse 8 vibes in one run.",
    tier: "cosmic",
    condition: (_, r) => r.cleanses >= 8,
  },
  {
    slug: "legendary-cascade",
    title: "LEGENDARY CASCADE",
    description: "Reach a bloom chain of 25 in one run.",
    tier: "cosmic",
    condition: (_, r) => r.maxChain >= 25,
  },
];

export function evaluateGardenAchievements(
  persisted: GardenPersisted,
  run: RunStats
): GardenAchievementDef[] {
  const owned = new Set(persisted.achievements);
  return GARDEN_ACHIEVEMENTS.filter((a) => !owned.has(a.slug) && a.condition(persisted, run));
}

export function earnedGardenSlugs(p: GardenPersisted): Set<string> {
  const s = p.stats;
  const earned = new Set<string>();
  if (s.maxBloomChain >= 1) earned.add("first-bloom");
  if (s.totalPlants >= 20) earned.add("zen-cultivator");
  if (s.maxBloomChain >= 5) earned.add("garden-chain-5");
  if (s.maxBloomChain >= 10) earned.add("chain-10");
  if (s.bestCleansesInRun >= 3) earned.add("corruption-survivor");
  if (s.goldBlooms >= 1) earned.add("golden-ecosystem");
  if (p.bestClassic >= 5000) earned.add("master-gardener");
  if (p.bestClassic >= 10_000) earned.add("garden-score-10k");
  if (s.bestCleansesInRun >= 8) earned.add("perfect-stabilization");
  if (s.maxBloomChain >= 25) earned.add("legendary-cascade");
  return earned;
}

export function reconcileGardenAchievements(p: GardenPersisted): GardenPersisted {
  const owned = new Set(p.achievements);
  const earned = earnedGardenSlugs(p);
  const missing = GARDEN_ACHIEVEMENTS.map((a) => a.slug).filter((slug) => earned.has(slug) && !owned.has(slug));
  if (!missing.length) return p;
  const next = { ...p, achievements: [...p.achievements, ...missing] };
  saveGardenPersisted(next);
  return next;
}

export function buildGardenBadgeRows(p: GardenPersisted): BadgeRow[] {
  const owned = new Set(p.achievements);
  const earned = earnedGardenSlugs(p);
  const s = p.stats;

  const row = (def: GardenAchievementDef, current: number, target: number): BadgeRow => ({
    slug: def.slug,
    title: def.title,
    description: def.description,
    tier: def.tier,
    unlocked: owned.has(def.slug) || earned.has(def.slug),
    current,
    target,
  });

  return finalizeBadgeRows([
    row(GARDEN_ACHIEVEMENTS[0], s.maxBloomChain, 1),
    row(GARDEN_ACHIEVEMENTS[1], s.totalPlants, 20),
    row(GARDEN_ACHIEVEMENTS[2], s.maxBloomChain, 5),
    row(GARDEN_ACHIEVEMENTS[3], s.maxBloomChain, 10),
    row(GARDEN_ACHIEVEMENTS[4], s.bestCleansesInRun, 3),
    row(GARDEN_ACHIEVEMENTS[5], s.goldBlooms >= 1 ? 1 : 0, 1),
    row(GARDEN_ACHIEVEMENTS[6], p.bestClassic, 5000),
    row(GARDEN_ACHIEVEMENTS[7], p.bestClassic, 10_000),
    row(GARDEN_ACHIEVEMENTS[8], s.bestCleansesInRun, 8),
    row(GARDEN_ACHIEVEMENTS[9], s.maxBloomChain, 25),
  ]);
}
