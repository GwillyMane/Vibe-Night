import type { MergePersisted } from "./mergeStorage";

export interface MergeGoalDef {
  id: string;
  title: string;
  description: string;
  target: number;
  progress: (p: MergePersisted) => number;
}

export const MERGE_GOALS: MergeGoalDef[] = [
  {
    id: "tier-5",
    title: "MID STACK",
    description: "Reach tier 5 in any run.",
    target: 1,
    progress: (p) => Math.min(1, p.highestTierEver >= 5 ? 1 : 0),
  },
  {
    id: "tier-7",
    title: "VIBEFOOT",
    description: "Reach Vibefoot (tier 7).",
    target: 1,
    progress: (p) => Math.min(1, p.highestTierEver >= 7 ? 1 : 0),
  },
  {
    id: "tier-8",
    title: "CHILL STACK",
    description: "Reach Chill Vibes Guy (tier 8).",
    target: 1,
    progress: (p) => Math.min(1, p.highestTierEver >= 8 ? 1 : 0),
  },
  {
    id: "tier-9",
    title: "CANDY BLOB",
    description: "Reach Candy Blob (tier 9).",
    target: 1,
    progress: (p) => Math.min(1, p.highestTierEver >= 9 ? 1 : 0),
  },
  {
    id: "tier-10",
    title: "MAX STACK",
    description: "Reach Pebbles and Seeds (tier 10).",
    target: 1,
    progress: (p) => Math.min(1, p.highestTierEver >= 10 ? 1 : 0),
  },
  {
    id: "combo-3",
    title: "CHAIN REACTION",
    description: "Hit a 3× combo in one run.",
    target: 1,
    progress: (p) => Math.min(1, p.maxCombo >= 3 ? 1 : 0),
  },
  {
    id: "score-10k",
    title: "STACK MASTER",
    description: "Score 10,000 in one run.",
    target: 1,
    progress: (p) => Math.min(1, Math.max(p.bestClassic, p.bestDaily) >= 10_000 ? 1 : 0),
  },
  {
    id: "merges-100",
    title: "MERGE MACHINE",
    description: "Merge 100 vibes lifetime.",
    target: 100,
    progress: (p) => Math.min(100, p.totalMerges),
  },
];
