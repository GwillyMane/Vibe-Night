import { ROWS, type LuckyMode, type SymbolId } from "./luckyConfig";
import { drawSymbol } from "./luckyRng";

/** Random symbols before the target column — strip scroll ends aligned here. */
export const STRIP_PREFIX_LEN = 20;

export function buildReelStrip(
  seed: string,
  spinIndex: number,
  reel: number,
  targetColumn: SymbolId[],
  mode: LuckyMode
): SymbolId[] {
  const prefix: SymbolId[] = [];
  for (let i = 0; i < STRIP_PREFIX_LEN; i++) {
    prefix.push(drawSymbol(`${seed}:strip:${spinIndex}:r${reel}:i${i}`, spinIndex, reel, i % ROWS, "base", mode));
  }
  return [...prefix, ...targetColumn];
}

export function settledScrollPx(prefixLen: number, cellHeight: number): number {
  return prefixLen * cellHeight;
}

export function stripTotalHeight(stripLen: number, cellHeight: number): number {
  return stripLen * cellHeight;
}

/** Wrap scroll into strip range. */
export function wrapScroll(scroll: number, stripLen: number, cellHeight: number): number {
  const total = stripTotalHeight(stripLen, cellHeight);
  if (total <= 0) return 0;
  return ((scroll % total) + total) % total;
}

export function columnFromGrid(grid: SymbolId[][], reel: number): SymbolId[] {
  const col: SymbolId[] = [];
  for (let y = 0; y < ROWS; y++) col.push(grid[reel]![y]!);
  return col;
}
