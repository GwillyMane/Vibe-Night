import type { GardenColorId } from "./gardenConfig";

export function comboMultiplier(combo: number): number {
  if (combo <= 1) return 1;
  let m = 1;
  for (let i = 2; i <= combo; i++) {
    m += i <= 3 ? 1 : i <= 6 ? 0.75 : 0.5;
  }
  return Math.min(12, m);
}

export function baseBloomPoints(colorId: GardenColorId): number {
  if (colorId === 6) return 80;
  return 20 + colorId * 8;
}

export function cleansePoints(chain: number): number {
  return 45 + chain * 12;
}

export function goldenBloomBonus(): number {
  return 500;
}

export function survivalTickPoints(): number {
  return 2;
}

export function popBonusPoints(pops: number): number {
  if (pops <= 0) return 0;
  return pops * 24;
}

export function milestoneLabel(chain: number): string | null {
  if (chain >= 50) return "LEGENDARY GARDEN";
  if (chain === 25) return "PERFECT ECOSYSTEM";
  if (chain === 10) return "VIBE SURGE";
  if (chain >= 7) return "ECOSYSTEM SURGE";
  if (chain >= 6) return "CHAIN REACTION";
  if (chain >= 4 && chain % 4 === 0) return `BLOOM CHAIN x${chain}`;
  return null;
}
