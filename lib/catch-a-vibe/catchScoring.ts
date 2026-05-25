import type { CatchColorId } from "./catchConfig";

export function comboMultiplier(combo: number): number {
  if (combo <= 1) return 1;
  let m = 1;
  for (let i = 2; i <= combo; i++) {
    m += i <= 3 ? 1 : i <= 6 ? 0.75 : 0.5;
  }
  return Math.min(14, m);
}

export function baseCatchPoints(colorId: CatchColorId): number {
  if (colorId === 6) return 90;
  return 25 + colorId * 10;
}

export function cleansePoints(combo: number): number {
  return 50 + combo * 14;
}

export function nearMissBonus(): number {
  return 15;
}

export function goldenCatchBonus(): number {
  return 400;
}

/** Passive score for staying alive. */
export function survivalScorePerSec(elapsedMs: number): number {
  return Math.max(1, Math.round(1 + Math.min(3, elapsedMs / 45_000)));
}
