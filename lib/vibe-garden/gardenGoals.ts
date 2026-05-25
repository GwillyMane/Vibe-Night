import type { GardenPersisted } from "./gardenStorage";

export interface GardenGoalDef {
  id: string;
  title: string;
  description: string;
  target: number;
  progress: (p: GardenPersisted) => number;
}

export const GARDEN_GOALS: GardenGoalDef[] = [
  {
    id: "plants-50",
    title: "Green Thumb",
    description: "Plant 50 vibes total",
    target: 50,
    progress: (p) => p.stats.totalPlants,
  },
  {
    id: "chain-15",
    title: "Chain Reaction",
    description: "Reach a bloom chain of 15 (best run)",
    target: 15,
    progress: (p) => p.stats.maxBloomChain,
  },
  {
    id: "cleanses-10",
    title: "Corruption Cleanser",
    description: "Cleanse 10 corrupted vibes total",
    target: 10,
    progress: (p) => p.stats.cleanses,
  },
  {
    id: "score-3k",
    title: "Thriving Garden",
    description: "Best classic score of 3,000",
    target: 3000,
    progress: (p) => p.bestClassic,
  },
  {
    id: "runs-10",
    title: "Regular Gardener",
    description: "Complete 10 runs",
    target: 10,
    progress: (p) => p.stats.runs,
  },
];
