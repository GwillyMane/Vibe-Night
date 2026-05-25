import type { Board, Cell } from "./shiftBoard";
import type { ShiftColorId } from "./shiftConfig";

export type MatchKind = "horizontal" | "vertical" | "line4" | "line5" | "square";

export interface MatchGroup {
  id: string;
  kind: MatchKind;
  coords: { r: number; c: number }[];
  color: ShiftColorId;
  /** Line length or square side length */
  size: number;
  label: string;
}

export interface MatchResult {
  coords: { r: number; c: number }[];
  cellCount: number;
  groups: MatchGroup[];
}

const key = (r: number, c: number) => `${r},${c}`;

function lineKind(axis: "horizontal" | "vertical", len: number): MatchKind {
  if (len >= 5) return "line5";
  if (len >= 4) return "line4";
  return axis;
}

function lineLabel(kind: MatchKind): string {
  switch (kind) {
    case "line5":
      return "MEGA LINE!";
    case "line4":
      return "BIG LINE!";
    case "horizontal":
      return "ROW MATCH!";
    case "vertical":
      return "COL MATCH!";
    default:
      return "MATCH!";
  }
}

function detectLines(board: Board): MatchGroup[] {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  const groups: MatchGroup[] = [];
  let gid = 0;

  for (let r = 0; r < rows; r++) {
    let c = 0;
    while (c < cols) {
      const color = board[r]![c];
      if (color === null) {
        c++;
        continue;
      }
      let end = c + 1;
      while (end < cols && board[r]![end] === color) end++;
      const len = end - c;
      if (len >= 3) {
        const kind = lineKind("horizontal", len);
        const coords = Array.from({ length: len }, (_, i) => ({ r, c: c + i }));
        groups.push({
          id: `h-${gid++}`,
          kind,
          coords,
          color,
          size: len,
          label: lineLabel(kind),
        });
      }
      c = end;
    }
  }

  for (let c = 0; c < cols; c++) {
    let r = 0;
    while (r < rows) {
      const color = board[r]![c];
      if (color === null) {
        r++;
        continue;
      }
      let end = r + 1;
      while (end < rows && board[end]![c] === color) end++;
      const len = end - r;
      if (len >= 3) {
        const kind = lineKind("vertical", len);
        const coords = Array.from({ length: len }, (_, i) => ({ r: r + i, c }));
        groups.push({
          id: `v-${gid++}`,
          kind,
          coords,
          color,
          size: len,
          label: lineLabel(kind),
        });
      }
      r = end;
    }
  }

  return groups;
}

function detectSquares(board: Board): MatchGroup[] {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  const groups: MatchGroup[] = [];
  let gid = 0;

  for (let size = 3; size >= 2; size--) {
    for (let r = 0; r <= rows - size; r++) {
      for (let c = 0; c <= cols - size; c++) {
        const color = board[r]![c];
        if (color === null) continue;
        let ok = true;
        const coords: { r: number; c: number }[] = [];
        for (let dr = 0; dr < size && ok; dr++) {
          for (let dc = 0; dc < size; dc++) {
            if (board[r + dr]![c + dc] !== color) {
              ok = false;
              break;
            }
            coords.push({ r: r + dr, c: c + dc });
          }
        }
        if (!ok) continue;
        groups.push({
          id: `sq-${size}-${gid++}`,
          kind: "square",
          coords,
          color,
          size,
          label: size >= 3 ? "BIG SQUARE!" : "SQUARE!",
        });
      }
    }
  }

  return groups;
}

export function findMatchGroups(board: Board): MatchGroup[] {
  return [...detectLines(board), ...detectSquares(board)];
}

export function findMatches(board: Board): MatchResult {
  const groups = findMatchGroups(board);
  const matched = new Set<string>();
  for (const g of groups) {
    for (const { r, c } of g.coords) matched.add(key(r, c));
  }
  const coords = [...matched].map((k) => {
    const [rs, cs] = k.split(",");
    return { r: Number(rs), c: Number(cs) };
  });
  return { coords, cellCount: coords.length, groups };
}

export function hasAnyMatch(board: Board): boolean {
  return findMatches(board).cellCount > 0;
}

export function clearMatches(board: Board, coords: { r: number; c: number }[]): Board {
  const next = board.map((row) => [...row]);
  for (const { r, c } of coords) next[r]![c] = null;
  return next;
}

export function boardHasNulls(board: Board): boolean {
  return board.some((row) => row.some((cell) => cell === null));
}

export function countColors(board: Board): Record<ShiftColorId, number> {
  const counts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<ShiftColorId, number>;
  for (const row of board) {
    for (const cell of row) {
      if (cell !== null) counts[cell]++;
    }
  }
  return counts;
}

export function cellColor(board: Board, r: number, c: number): ShiftColorId | null {
  const cell = board[r]?.[c];
  return cell ?? null;
}
