import { seededRandom } from "@/lib/daily-seed";

import { createBoard, type Board } from "./shiftBoard";

import { hasLegalMoves } from "./shiftLegalMoves";

import {

  BOARD_GEN_MAX_RETRIES,

  CLASSIC_LEVEL_COUNT,

  CLASSIC_LEVEL_TARGETS,

  GRID_COLS,

  GRID_ROWS,

} from "./shiftConfig";



export function getLevelTarget(level: number): number {

  const idx = Math.min(CLASSIC_LEVEL_COUNT, Math.max(1, level)) - 1;

  return CLASSIC_LEVEL_TARGETS[idx] ?? CLASSIC_LEVEL_TARGETS[CLASSIC_LEVEL_TARGETS.length - 1]!;

}



export function checkLevelAdvance(

  score: number,

  currentLevel: number

): { advanced: boolean; newLevel: number; runComplete: boolean } {

  let level = currentLevel;

  let advanced = false;

  while (level < CLASSIC_LEVEL_COUNT && score >= getLevelTarget(level)) {

    level++;

    advanced = true;

  }

  return {

    advanced,

    newLevel: level,

    runComplete: level >= CLASSIC_LEVEL_COUNT && score >= getLevelTarget(CLASSIC_LEVEL_COUNT),

  };

}



export function createLevelBoard(runSeed: string, level: number): Board {

  for (let attempt = 0; attempt < BOARD_GEN_MAX_RETRIES; attempt++) {

    const rand = seededRandom(`shift-classic:${runSeed}:L${level}:a${attempt}`);

    const board = createBoard(GRID_ROWS, GRID_COLS, rand);

    if (hasLegalMoves(board)) return board;

  }

  const rand = seededRandom(`shift-classic:${runSeed}:L${level}:fallback`);

  return createBoard(GRID_ROWS, GRID_COLS, rand);

}


