import { REELS, ROWS, type LuckyMode, type SymbolId } from "./luckyConfig";
import type { LockedOrb } from "./luckyLockFeature";
import { drawSymbol, type DrawPhase } from "./luckyRng";

export type Grid = SymbolId[][];

export function createBlankGrid(): Grid {
  return Array.from({ length: REELS }, () => Array<SymbolId>(ROWS).fill("blank"));
}

export function createEmptyGrid(): Grid {
  return Array.from({ length: REELS }, () => Array<SymbolId>(ROWS).fill("face:0"));
}

export function cloneGrid(grid: Grid): Grid {
  return grid.map((col) => [...col]);
}

export function generateGrid(
  seed: string,
  spinIndex: number,
  mode: LuckyMode,
  phase: DrawPhase = "base"
): Grid {
  const grid = createEmptyGrid();
  for (let r = 0; r < REELS; r++) {
    for (let y = 0; y < ROWS; y++) {
      grid[r]![y] = drawSymbol(seed, spinIndex, r, y, phase, mode);
    }
  }
  return grid;
}

export function countSymbol(grid: Grid, symbol: SymbolId): number {
  let n = 0;
  for (let r = 0; r < REELS; r++) {
    for (let y = 0; y < ROWS; y++) {
      if (grid[r]![y] === symbol) n++;
    }
  }
  return n;
}

export function countScatters(grid: Grid): number {
  return countSymbol(grid, "scatter");
}

export function countOrbs(grid: Grid): number {
  return countSymbol(grid, "orb");
}

/** Display grid for Vibe Lock — locked Craig + blank elsewhere. */
export function gridFromVibeLockState(locked: LockedOrb[]): Grid {
  const grid = createBlankGrid();
  for (const orb of locked) {
    grid[orb.coord.reel]![orb.coord.row] = "orb";
  }
  return grid;
}

/** @deprecated use gridFromVibeLockState */
export function gridFromLockedOrbs(locked: LockedOrb[]): Grid {
  return gridFromVibeLockState(locked);
}

export interface CellCoord {
  reel: number;
  row: number;
}

export function allCells(): CellCoord[] {
  const out: CellCoord[] = [];
  for (let r = 0; r < REELS; r++) {
    for (let y = 0; y < ROWS; y++) out.push({ reel: r, row: y });
  }
  return out;
}

export function cellKey(c: CellCoord): string {
  return `${c.reel},${c.row}`;
}

export function gridHasToken(grid: Grid, tokenId: "430" | "1151" | "1400"): boolean {
  const sym = `token:${tokenId}` as SymbolId;
  return countSymbol(grid, sym) > 0;
}
