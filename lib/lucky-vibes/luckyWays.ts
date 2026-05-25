import { PAYING_SYMBOLS, PAYTABLE, REELS, ROWS, type SymbolId } from "./luckyConfig";
import type { CellCoord, Grid } from "./luckyGrid";
import { cellKey } from "./luckyGrid";

export interface WayWin {
  symbol: SymbolId;
  reelCount: 3 | 4 | 5 | 6;
  ways: number;
  cells: CellCoord[];
  basePoints: number;
}

function matchesSymbol(cell: SymbolId, paySymbol: SymbolId): boolean {
  if (cell === "scatter" || cell === "orb") return false;
  if (cell === "wild") return paySymbol !== "wild";
  return cell === paySymbol;
}

function countOnReel(grid: Grid, reel: number, paySymbol: SymbolId): { count: number; cells: CellCoord[] } {
  const cells: CellCoord[] = [];
  for (let y = 0; y < ROWS; y++) {
    const sym = grid[reel]![y]!;
    if (matchesSymbol(sym, paySymbol) || (paySymbol !== "wild" && sym === "wild")) {
      cells.push({ reel, row: y });
    }
  }
  return { count: cells.length, cells };
}

function evaluatePaySymbol(grid: Grid, paySymbol: SymbolId): WayWin | null {
  const reelCounts: number[] = [];
  const reelCells: CellCoord[][] = [];

  for (let r = 0; r < REELS; r++) {
    const { count, cells } = countOnReel(grid, r, paySymbol);
    if (count === 0) break;
    reelCounts.push(count);
    reelCells.push(cells);
  }

  const len = reelCounts.length;
  if (len < 3) return null;

  const reelCount = Math.min(len, 6) as 3 | 4 | 5 | 6;
  let ways = 1;
  for (let i = 0; i < reelCount; i++) ways *= reelCounts[i]!;

  const table = PAYTABLE[paySymbol];
  if (!table) return null;
  const basePoints = table[reelCount] * ways;
  if (basePoints <= 0) return null;

  const cells: CellCoord[] = [];
  for (let i = 0; i < reelCount; i++) cells.push(...reelCells[i]!);

  return { symbol: paySymbol, reelCount, ways, cells, basePoints };
}

/** Wild-only win when no other symbol claims a longer run. */
function evaluateWildOnly(grid: Grid): WayWin | null {
  let consecutive = 0;
  const reelCells: CellCoord[][] = [];

  for (let r = 0; r < REELS; r++) {
    const wildCells: CellCoord[] = [];
    for (let y = 0; y < ROWS; y++) {
      if (grid[r]![y] === "wild") wildCells.push({ reel: r, row: y });
    }
    if (wildCells.length === 0) break;
    consecutive++;
    reelCells.push(wildCells);
  }

  if (consecutive < 3) return null;
  const reelCount = Math.min(consecutive, 6) as 3 | 4 | 5 | 6;
  let ways = 1;
  for (let i = 0; i < reelCount; i++) ways *= reelCells[i]!.length;

  const basePoints = PAYTABLE.wild![reelCount] * ways;
  const cells = reelCells.slice(0, reelCount).flat();
  return { symbol: "wild", reelCount, ways, cells, basePoints };
}

export function evaluateWays(grid: Grid): WayWin[] {
  const wins: WayWin[] = [];
  const seen = new Set<string>();

  for (const sym of PAYING_SYMBOLS) {
    if (sym === "wild") continue;
    const w = evaluatePaySymbol(grid, sym);
    if (w) {
      const key = `${w.symbol}:${w.reelCount}`;
      if (!seen.has(key)) {
        wins.push(w);
        seen.add(key);
      }
    }
  }

  const wildWin = evaluateWildOnly(grid);
  if (wildWin) {
    const dominated = wins.some(
      (w) => w.reelCount >= wildWin.reelCount && w.basePoints >= wildWin.basePoints
    );
    if (!dominated) wins.push(wildWin);
  }

  return wins;
}

export function winningCellKeys(wins: WayWin[]): Set<string> {
  const keys = new Set<string>();
  for (const w of wins) {
    for (const c of w.cells) keys.add(cellKey(c));
  }
  return keys;
}

export function totalWayPoints(wins: WayWin[]): number {
  return wins.reduce((s, w) => s + w.basePoints, 0);
}
