import { COLOR_COUNT, GRID_COLS, GRID_ROWS, type ShiftColorId } from "./shiftConfig";



export type Cell = ShiftColorId | null;

export type Board = Cell[][];



export type ShiftMove = { axis: "row" | "col"; index: number; dir: 1 | -1 };



export function cloneBoard(board: Board): Board {

  return board.map((row) => [...row]);

}



export function createEmptyBoard(rows = GRID_ROWS, cols = GRID_COLS): Board {

  return Array.from({ length: rows }, () => Array<Cell>(cols).fill(null));

}



function randColor(rand: () => number): ShiftColorId {

  return Math.floor(rand() * COLOR_COUNT) as ShiftColorId;

}



/** Fill board avoiding initial auto-matches. */

export function createBoard(rows: number, cols: number, rand: () => number): Board {

  const board = createEmptyBoard(rows, cols);

  for (let r = 0; r < rows; r++) {

    for (let c = 0; c < cols; c++) {

      let color: ShiftColorId;

      let attempts = 0;

      do {

        color = randColor(rand);

        attempts++;

      } while (attempts < 12 && wouldFormMatchAt(board, r, c, color));

      board[r]![c] = color;

    }

  }

  return board;

}



function wouldFormMatchAt(board: Board, r: number, c: number, color: ShiftColorId): boolean {

  let h = 1;

  for (let x = c - 1; x >= 0 && board[r]![x] === color; x--) h++;

  for (let x = c + 1; x < board[r]!.length && board[r]![x] === color; x++) h++;

  if (h >= 3) return true;

  let v = 1;

  for (let y = r - 1; y >= 0 && board[y]![c] === color; y--) v++;

  for (let y = r + 1; y < board.length && board[y]![c] === color; y++) v++;

  return v >= 3;

}



export function slideRow(board: Board, rowIndex: number, dir: 1 | -1): Board {

  const next = cloneBoard(board);

  const row = next[rowIndex]!;

  const len = row.length;

  if (dir === 1) {

    const last = row[len - 1];

    for (let i = len - 1; i > 0; i--) row[i] = row[i - 1]!;

    row[0] = last!;

  } else {

    const first = row[0];

    for (let i = 0; i < len - 1; i++) row[i] = row[i + 1]!;

    row[len - 1] = first!;

  }

  return next;

}



export function slideCol(board: Board, colIndex: number, dir: 1 | -1): Board {

  const next = cloneBoard(board);

  const rows = next.length;

  if (dir === 1) {

    const last = next[rows - 1]![colIndex];

    for (let r = rows - 1; r > 0; r--) next[r]![colIndex] = next[r - 1]![colIndex]!;

    next[0]![colIndex] = last!;

  } else {

    const first = next[0]![colIndex];

    for (let r = 0; r < rows - 1; r++) next[r]![colIndex] = next[r + 1]![colIndex]!;

    next[rows - 1]![colIndex] = first!;

  }

  return next;

}



export function applySlide(board: Board, move: ShiftMove): Board {

  return move.axis === "row" ? slideRow(board, move.index, move.dir) : slideCol(board, move.index, move.dir);

}


