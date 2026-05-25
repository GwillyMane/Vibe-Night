import { applySlide, cloneBoard, type Board, type ShiftMove } from "./shiftBoard";

import { hasAnyMatch } from "./shiftMatch";



export function wouldMatch(board: Board, move: ShiftMove): boolean {

  const slid = applySlide(board, move);

  return hasAnyMatch(slid);

}



export function findLegalMoves(board: Board): ShiftMove[] {

  const moves: ShiftMove[] = [];

  const rows = board.length;

  const cols = board[0]?.length ?? 0;



  for (let r = 0; r < rows; r++) {

    for (const dir of [1, -1] as const) {

      const move: ShiftMove = { axis: "row", index: r, dir };

      if (wouldMatch(board, move)) moves.push(move);

    }

  }

  for (let c = 0; c < cols; c++) {

    for (const dir of [1, -1] as const) {

      const move: ShiftMove = { axis: "col", index: c, dir };

      if (wouldMatch(board, move)) moves.push(move);

    }

  }

  return moves;

}



export function hasLegalMoves(board: Board): boolean {

  return findLegalMoves(board).length > 0;

}



export function moveKey(move: ShiftMove): string {

  return `${move.axis}:${move.index}:${move.dir}`;

}


