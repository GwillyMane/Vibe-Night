import { finalizeBadgeRows } from "@/lib/arcade/badgeProgress";
import type { BadgeRow } from "@/lib/arcade/badgeTypes";
import type { MergePersisted } from "./mergeStorage";
import { saveMergePersisted } from "./mergeStorage";

export interface MergeAchievementDef {
  slug: string;
  title: string;
  description: string;
  tier: "bronze" | "silver" | "gold" | "cosmic";
}

export const MERGE_ACHIEVEMENTS: MergeAchievementDef[] = [
  { slug: "merge-first", title: "FIRST MERGE", description: "Complete your first merge.", tier: "bronze" },
  { slug: "merge-combo-3", title: "COMBO CREATOR", description: "Hit a 3-chain combo.", tier: "silver" },
  { slug: "merge-gold", title: "PINK PEAK", description: "Create a Pink Vibe (tier 5).", tier: "silver" },
  { slug: "merge-daily", title: "DAILY GRINDER", description: "Set a daily best score.", tier: "silver" },
  { slug: "merge-vibefoot", title: "VIBEFOOT", description: "Merge into Vibefoot (tier 7).", tier: "gold" },
  { slug: "merge-chill", title: "CHILL STACK", description: "Create Chill Vibes Guy (tier 8).", tier: "gold" },
  { slug: "merge-10k", title: "STACK STARTER", description: "Score 10,000 in one run.", tier: "gold" },
  { slug: "merge-candy", title: "CANDY BLOB", description: "Merge into Candy Blob (tier 9).", tier: "gold" },
  { slug: "merge-50k", title: "VIBETOWN VETERAN", description: "Score 50,000 in one run.", tier: "cosmic" },
  { slug: "merge-legend", title: "PEBBLES & SEEDS", description: "Reach the top tier — Pebbles and Seeds.", tier: "cosmic" },
];

export function evaluateMergeAchievements(
  owned: Set<string>,
  run: {
    score: number;
    highestTier: number;
    maxCombo: number;
    merges: number;
    mode: "classic" | "daily";
  },
  p: MergePersisted
): MergeAchievementDef[] {
  const newly: MergeAchievementDef[] = [];
  const tryUnlock = (slug: string) => {
    if (owned.has(slug)) return;
    const def = MERGE_ACHIEVEMENTS.find((a) => a.slug === slug);
    if (def) {
      owned.add(slug);
      newly.push(def);
    }
  };

  if (run.merges >= 1 || p.totalMerges > 0) tryUnlock("merge-first");
  if (run.maxCombo >= 3) tryUnlock("merge-combo-3");
  if (run.highestTier >= 5) tryUnlock("merge-gold");
  if (run.highestTier >= 7) tryUnlock("merge-vibefoot");
  if (run.highestTier >= 8) tryUnlock("merge-chill");
  if (run.highestTier >= 9) tryUnlock("merge-candy");
  if (run.highestTier >= 10) tryUnlock("merge-legend");
  if (run.score >= 10_000) tryUnlock("merge-10k");
  if (run.score >= 50_000) tryUnlock("merge-50k");
  if (run.mode === "daily" && run.score > 0) tryUnlock("merge-daily");

  return newly;
}

export function earnedMergeSlugs(p: MergePersisted): Set<string> {
  const bestScore = Math.max(p.bestClassic, p.bestDaily);
  const earned = new Set<string>();
  if (p.totalMerges >= 1) earned.add("merge-first");
  if (p.maxCombo >= 3) earned.add("merge-combo-3");
  if (p.highestTierEver >= 5) earned.add("merge-gold");
  if (p.bestDaily > 0) earned.add("merge-daily");
  if (p.highestTierEver >= 7) earned.add("merge-vibefoot");
  if (p.highestTierEver >= 8) earned.add("merge-chill");
  if (bestScore >= 10_000) earned.add("merge-10k");
  if (p.highestTierEver >= 9) earned.add("merge-candy");
  if (bestScore >= 50_000) earned.add("merge-50k");
  if (p.highestTierEver >= 10) earned.add("merge-legend");
  return earned;
}

export function reconcileMergeAchievements(p: MergePersisted): MergePersisted {
  const owned = new Set(p.achievements);
  const earned = earnedMergeSlugs(p);
  const missing = MERGE_ACHIEVEMENTS.map((a) => a.slug).filter((slug) => earned.has(slug) && !owned.has(slug));
  if (!missing.length) return p;
  const next = { ...p, achievements: [...p.achievements, ...missing] };
  saveMergePersisted(next);
  return next;
}

export function buildMergeBadgeRows(p: MergePersisted): BadgeRow[] {
  const owned = new Set(p.achievements);
  const earned = earnedMergeSlugs(p);
  const bestScore = Math.max(p.bestClassic, p.bestDaily);

  const row = (def: MergeAchievementDef, current: number, target: number): BadgeRow => ({
    ...def,
    unlocked: owned.has(def.slug) || earned.has(def.slug),
    current,
    target,
  });

  return finalizeBadgeRows([
    row(MERGE_ACHIEVEMENTS[0], p.totalMerges, 1),
    row(MERGE_ACHIEVEMENTS[1], p.maxCombo, 3),
    row(MERGE_ACHIEVEMENTS[2], p.highestTierEver, 5),
    row(MERGE_ACHIEVEMENTS[3], p.bestDaily > 0 ? 1 : 0, 1),
    row(MERGE_ACHIEVEMENTS[4], p.highestTierEver, 7),
    row(MERGE_ACHIEVEMENTS[5], p.highestTierEver, 8),
    row(MERGE_ACHIEVEMENTS[6], bestScore, 10_000),
    row(MERGE_ACHIEVEMENTS[7], p.highestTierEver, 9),
    row(MERGE_ACHIEVEMENTS[8], bestScore, 50_000),
    row(MERGE_ACHIEVEMENTS[9], p.highestTierEver, 10),
  ]);
}
