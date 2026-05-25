import type { Board, Cell } from "./shiftBoard";
import { COLOR_COUNT, type ShiftColorId } from "./shiftConfig";

export interface FallMove {
  cell: ShiftColorId;
  col: number;
  fromRow: number;
  toRow: number;
  isNew: boolean;
}

export interface GravityResult {
  board: Board;
  falls: FallMove[];
}

/** Compact each column downward and spawn new vibes from above. */
export function gravityAndRefill(board: Board, rand: () => number): GravityResult {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  const next = board.map((row) => [...row]);
  const falls: FallMove[] = [];

  for (let c = 0; c < cols; c++) {
    const surviving: { cell: ShiftColorId; fromRow: number }[] = [];
    for (let r = 0; r < rows; r++) {
      const cell = board[r]![c];
      if (cell !== null) surviving.push({ cell, fromRow: r });
    }

    const newCount = rows - surviving.length;
    for (let r = 0; r < rows; r++) next[r]![c] = null;

    for (let i = 0; i < newCount; i++) {
      const cell = Math.floor(rand() * COLOR_COUNT) as ShiftColorId;
      next[i]![c] = cell;
      falls.push({ cell, col: c, fromRow: i - newCount, toRow: i, isNew: true });
    }

    for (let i = 0; i < surviving.length; i++) {
      const toRow = newCount + i;
      const { cell, fromRow } = surviving[i]!;
      next[toRow]![c] = cell;
      if (fromRow !== toRow) {
        falls.push({ cell, col: c, fromRow, toRow, isNew: false });
      }
    }
  }

  return { board: next, falls };
}

export function easeOutBounce(t: number): number {
  if (t < 0.65) return easeOutCubic(t / 0.65) * 0.92;
  const x = (t - 0.65) / 0.35;
  return 0.92 + x * 0.08 - Math.sin(x * Math.PI) * 0.04;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/** Cells currently animating — hide their source grid slot while progress < 1. */
export function hiddenSlotsDuringFall(falls: FallMove[], progress: number): Set<string> {
  const hidden = new Set<string>();
  if (progress >= 1) return hidden;
  for (const f of falls) {
    if (!f.isNew) hidden.add(`${f.fromRow},${f.col}`);
  }
  return hidden;
}

export function fallY(f: FallMove, cs: number, progress: number): number {
  const eased = easeOutBounce(Math.min(1, Math.max(0, progress)));
  const from = f.fromRow * cs;
  const to = f.toRow * cs;
  return from + (to - from) * eased;
}
