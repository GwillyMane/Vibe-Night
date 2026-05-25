import { tierDef } from "./mergeConfig";
import type { MergeTierId } from "./mergeConfig";

export interface MergeScoreEvent {
  mergedIntoTier: MergeTierId;
  comboMultiplier: number;
  points: number;
  label: string;
}

export function pointsForMerge(mergedIntoTier: MergeTierId, combo: number): MergeScoreEvent {
  const def = tierDef(mergedIntoTier);
  const mult =
    combo <= 1 ? 1 : combo === 2 ? 2 : combo === 3 ? 3.25 : Math.min(10, 3.25 + (combo - 3) * 0.85);
  const points = Math.round(def.scoreOnMerge * mult);
  let label = `+${points.toLocaleString()}`;
  if (combo >= 4) label = `MEGA CHAIN x${combo}`;
  else if (combo >= 3) label = `VIBE CHAIN x${combo}`;
  else if (combo >= 2) label = `COMBO x${combo}`;
  if (mergedIntoTier === 10) label = "PEBBLES & SEEDS";
  else if (mergedIntoTier === 9) label = "CANDY BLOB";
  else if (mergedIntoTier === 8) label = "CHILL VIBES";
  else if (mergedIntoTier === 7) label = "VIBEFOOT";
  else if (mergedIntoTier === 6) label = "PURPLE VIBE";
  else if (mergedIntoTier === 5) label = "PINK PEAK";
  return { mergedIntoTier, comboMultiplier: Math.round(mult * 10) / 10, points, label };
}

export function survivalBonus(ms: number): number {
  return Math.floor(ms / 1000) * 5;
}
