import type { CatchPersisted } from "./catchStorage";

export interface CatchGoalDef {
  id: string;
  title: string;
  description: string;
  target: number;
  progress: (p: CatchPersisted) => number;
}

export const CATCH_GOALS: CatchGoalDef[] = [
  {
    id: "catch-100",
    title: "Century Catch",
    description: "Catch 100 vibes lifetime",
    target: 100,
    progress: (p) => Math.min(1, p.stats.totalCatches / 100),
  },
  {
    id: "combo-10",
    title: "Chain Master",
    description: "Hit a 10 combo in any run",
    target: 1,
    progress: (p) => Math.min(1, p.stats.maxCombo >= 10 ? 1 : 0),
  },
  {
    id: "classic-3k",
    title: "High Scorer",
    description: "Score 3,000 in classic",
    target: 1,
    progress: (p) => Math.min(1, p.bestClassic >= 3000 ? 1 : 0),
  },
  {
    id: "cleanses-10",
    title: "Dodger",
    description: "Dodge 10 bad vibes lifetime",
    target: 10,
    progress: (p) => Math.min(1, p.stats.badDodged / 10),
  },
  {
    id: "runs-20",
    title: "Regular",
    description: "Complete 20 runs",
    target: 20,
    progress: (p) => Math.min(1, p.stats.runs / 20),
  },
];
