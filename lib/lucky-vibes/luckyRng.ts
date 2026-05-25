import { seededRandom } from "@/lib/daily-seed";
import type { LuckyMode, OrbValueKind, SymbolId, WeightedSymbol } from "./luckyConfig";
import {
  BASE_REEL_WEIGHTS,
  CRAIG_FAVORED_REEL_BOOST,
  CRAIG_FAVORED_REELS,
  LUCKY_SPINS_EXPANDED_REEL_BOOST,
  LUCKY_SPINS_EXPANDED_REELS,
  LUCKY_SPINS_REEL_WEIGHTS,
  ORB_VALUE_WEIGHTS,
  VIBE_LOCK_REEL_WEIGHTS,
} from "./luckyConfig";

export type DrawPhase = "base" | "luckySpins" | "vibeLock";

function pickWeighted(weights: WeightedSymbol[], rand: () => number): SymbolId {
  const total = weights.reduce((s, w) => s + w.weight, 0);
  let r = rand() * total;
  for (const w of weights) {
    r -= w.weight;
    if (r <= 0) return w.symbol;
  }
  return weights[weights.length - 1]!.symbol;
}

function boostExpandedReelWeights(weights: WeightedSymbol[]): WeightedSymbol[] {
  return weights.map((w) => {
    if (w.symbol.startsWith("token:") || w.symbol === "wild") {
      return { ...w, weight: w.weight * LUCKY_SPINS_EXPANDED_REEL_BOOST };
    }
    return w;
  });
}

function boostCraigOnReel(weights: WeightedSymbol[], reel: number): WeightedSymbol[] {
  if (!(CRAIG_FAVORED_REELS as readonly number[]).includes(reel)) return weights;
  return weights.map((w) =>
    w.symbol === "orb" ? { ...w, weight: w.weight * CRAIG_FAVORED_REEL_BOOST } : w
  );
}

export function drawSymbol(
  seed: string,
  spinIndex: number,
  reel: number,
  row: number,
  phase: DrawPhase,
  mode: LuckyMode
): SymbolId {
  const salt = `${seed}:${mode}:${phase}:s${spinIndex}:r${reel}:y${row}`;
  const rand = seededRandom(salt);
  let table =
    phase === "luckySpins"
      ? LUCKY_SPINS_REEL_WEIGHTS
      : phase === "vibeLock"
        ? VIBE_LOCK_REEL_WEIGHTS
        : BASE_REEL_WEIGHTS;

  if (phase === "luckySpins" && (LUCKY_SPINS_EXPANDED_REELS as readonly number[]).includes(reel)) {
    table = boostExpandedReelWeights(table);
  }
  if (phase === "base") {
    table = boostCraigOnReel(table, reel);
  }

  return pickWeighted(table, rand);
}

export function drawOrbValue(seed: string, lockStep: number, cellIndex: number): OrbValueKind {
  const rand = seededRandom(`${seed}:orb:${lockStep}:${cellIndex}`);
  const total = ORB_VALUE_WEIGHTS.reduce((s, w) => s + w.weight, 0);
  let r = rand() * total;
  for (const w of ORB_VALUE_WEIGHTS) {
    r -= w.weight;
    if (r <= 0) return w.kind;
  }
  return "10";
}

export function makeRand(seed: string, tag: string): () => number {
  return seededRandom(`${seed}:${tag}`);
}
