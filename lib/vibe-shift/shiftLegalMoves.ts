import { applySlide, cloneBoard, type Board, type ShiftMove } from "./shiftBoard";
import { hasAnyMatch } from "./shiftMatch";

export function wouldMatch(board: Board, move: ShiftMove): boolean {
  const slid = applySlide(board, move);
  return hasAnyMatch(slid);
}

/** Every row/column shift in both directions — all moves are playable. */
export function findLegalMoves(board: Board): ShiftMove[] {
  const moves: ShiftMove[] = [];
  const rows = board.length;
  const cols = board[0]?.length ?? 0;

  for (let r = 0; r < rows; r++) {
    for (const dir of [1, -1] as const) {
      moves.push({ axis: "row", index: r, dir });
    }
  }
  for (let c = 0; c < cols; c++) {
    for (const dir of [1, -1] as const) {
      moves.push({ axis: "col", index: c, dir });
    }
  }
  return moves;
}

/** True when at least one shift would create a match (used for board generation). */
export function hasScoringMove(board: Board): boolean {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  for (let r = 0; r < rows; r++) {
    for (const dir of [1, -1] as const) {
      if (wouldMatch(board, { axis: "row", index: r, dir })) return true;
    }
  }
  for (let c = 0; c < cols; c++) {
    for (const dir of [1, -1] as const) {
      if (wouldMatch(board, { axis: "col", index: c, dir })) return true;
    }
  }
  return false;
}

/** Any shift is allowed during play — gridlock from move availability is disabled. */
export function hasLegalMoves(board: Board): boolean {
  return board.length > 0 && (board[0]?.length ?? 0) > 0;
}

export function moveKey(move: ShiftMove): string {
  return `${move.axis}:${move.index}:${move.dir}`;
}
