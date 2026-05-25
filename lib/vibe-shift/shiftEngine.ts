import { seededRandom, todaySeed } from "@/lib/daily-seed";
import { applySlide, createBoard, type Board, type ShiftMove } from "./shiftBoard";
import { createLevelBoard, checkLevelAdvance, getLevelTarget } from "./shiftLevels";
import { hasLegalMoves } from "./shiftLegalMoves";
import { findMatches } from "./shiftMatch";
import { runCascadeLoop, type CascadeStepDetail } from "./shiftRefill";
import {
  BOARD_GEN_MAX_RETRIES,
  CLASSIC_LEVEL_COUNT,
  DAILY_MOVE_BUDGET,
  GRID_COLS,
  GRID_ROWS,
  type ShiftMode,
} from "./shiftConfig";
import type { ShiftEndReason } from "./shiftEndReason";

export type ShiftPhase = "idle" | "playing" | "levelUp" | "ended";

export interface ShiftMoveRecord {
  at: number;
  move: ShiftMove;
  scoreDelta: number;
  reverted: boolean;
}

export interface ShiftRunState {
  mode: ShiftMode;
  phase: ShiftPhase;
  seed: string;
  runSeed: string;
  board: Board;
  score: number;
  movesUsed: number;
  maxMoves: number | null;
  level: number;
  maxLevel: number;
  levelTarget: number;
  totalClears: number;
  maxCascade: number;
  moves: ShiftMoveRecord[];
  endReason: ShiftEndReason | null;
  startedAt: number;
}

export function createDailyBoard(seed: string): Board {
  for (let attempt = 0; attempt < BOARD_GEN_MAX_RETRIES; attempt++) {
    const rand = seededRandom(`shift-daily:${seed}:a${attempt}`);
    const board = createBoard(GRID_ROWS, GRID_COLS, rand);
    if (hasLegalMoves(board)) return board;
  }
  const rand = seededRandom(`shift-daily:${seed}:fallback`);
  return createBoard(GRID_ROWS, GRID_COLS, rand);
}

export function initClassicRun(runSeed: string): ShiftRunState {
  const board = createLevelBoard(runSeed, 1);
  return {
    mode: "classic",
    phase: "playing",
    seed: runSeed,
    runSeed,
    board,
    score: 0,
    movesUsed: 0,
    maxMoves: null,
    level: 1,
    maxLevel: CLASSIC_LEVEL_COUNT,
    levelTarget: getLevelTarget(1),
    totalClears: 0,
    maxCascade: 0,
    moves: [],
    endReason: null,
    startedAt: Date.now(),
  };
}

export function initDailyRun(seed?: string): ShiftRunState {
  const dailySeed = seed ?? todaySeed();
  const board = createDailyBoard(dailySeed);
  return {
    mode: "daily",
    phase: "playing",
    seed: dailySeed,
    runSeed: dailySeed,
    board,
    score: 0,
    movesUsed: 0,
    maxMoves: DAILY_MOVE_BUDGET,
    level: 1,
    maxLevel: 1,
    levelTarget: 0,
    totalClears: 0,
    maxCascade: 0,
    moves: [],
    endReason: null,
    startedAt: Date.now(),
  };
}

function finalizeAfterCascade(
  state: ShiftRunState,
  cascade: ReturnType<typeof runCascadeLoop>,
  record: ShiftMoveRecord
): ShiftRunState {
  const newScore = state.score + cascade.scoreFromCells;
  let next: ShiftRunState = {
    ...state,
    board: cascade.board,
    score: newScore,
    movesUsed: state.movesUsed + 1,
    totalClears: state.totalClears + cascade.totalCleared,
    maxCascade: Math.max(state.maxCascade, cascade.cascadeSteps),
    moves: [...state.moves, record],
  };

  if (state.mode === "classic") {
    const { newLevel, runComplete } = checkLevelAdvance(newScore, state.level);
    if (newLevel > state.level && !runComplete) {
      next = {
        ...next,
        level: newLevel,
        levelTarget: getLevelTarget(newLevel),
        board: createLevelBoard(state.runSeed, newLevel),
        phase: "levelUp",
      };
    } else if (runComplete) {
      next = { ...next, level: CLASSIC_LEVEL_COUNT, phase: "ended", endReason: "classic_complete" };
    } else if (!hasLegalMoves(cascade.board)) {
      next = { ...next, phase: "ended", endReason: "gridlock" };
    }
  } else {
    const budgetLeft = (state.maxMoves ?? DAILY_MOVE_BUDGET) - next.movesUsed;
    if (budgetLeft <= 0) {
      next = { ...next, phase: "ended", endReason: "daily_moves_exhausted" };
    } else if (!hasLegalMoves(cascade.board)) {
      next = { ...next, phase: "ended", endReason: "gridlock" };
    }
  }

  return next;
}

export interface PlayerMoveResult {
  state: ShiftRunState;
  reverted: boolean;
  steps: CascadeStepDetail[];
}

function applySuccessfulMove(
  state: ShiftRunState,
  move: ShiftMove,
  at: number
): PlayerMoveResult {
  const slid = applySlide(state.board, move);
  const cascade = runCascadeLoop(slid, `${state.runSeed}:${state.movesUsed}`);
  const record: ShiftMoveRecord = { at, move, scoreDelta: cascade.scoreFromCells, reverted: false };
  return {
    reverted: false,
    steps: cascade.steps,
    state: finalizeAfterCascade(state, cascade, record),
  };
}

export function applyPlayerMoveWithSteps(
  state: ShiftRunState,
  move: ShiftMove,
  at = Date.now()
): PlayerMoveResult {
  if (state.phase !== "playing") return { state, reverted: false, steps: [] };

  const slid = applySlide(state.board, move);
  if (!findMatches(slid).cellCount) {
    return {
      reverted: true,
      steps: [],
      state: {
        ...state,
        moves: [...state.moves, { at, move, scoreDelta: 0, reverted: true }],
      },
    };
  }

  return applySuccessfulMove(state, move, at);
}

export function applyPlayerMove(state: ShiftRunState, move: ShiftMove, at = Date.now()): ShiftRunState {
  return applyPlayerMoveWithSteps(state, move, at).state;
}

export function continueAfterLevelUp(state: ShiftRunState): ShiftRunState {
  if (state.phase !== "levelUp") return state;
  const board = createLevelBoard(state.runSeed, state.level);
  let next: ShiftRunState = { ...state, board, phase: "playing" };
  if (!hasLegalMoves(board)) {
    next = { ...next, phase: "ended", endReason: "gridlock" };
  }
  return next;
}

export function serializeMoves(moves: ShiftMoveRecord[]): string {
  return JSON.stringify(
    moves.map((m) => ({
      at: m.at,
      axis: m.move.axis,
      index: m.move.index,
      dir: m.move.dir,
      scoreDelta: m.scoreDelta,
      reverted: m.reverted,
    }))
  );
}

export function replayScore(seed: string, mode: ShiftMode, movesJson: string, runSeed?: string): number | null {
  try {
    const parsed = JSON.parse(movesJson) as Array<{
      axis: "row" | "col";
      index: number;
      dir: 1 | -1;
      reverted?: boolean;
    }>;
    let state = mode === "daily" ? initDailyRun(seed) : initClassicRun(runSeed ?? seed);
    for (const m of parsed) {
      if (m.reverted) continue;
      state = applyPlayerMove(state, { axis: m.axis, index: m.index, dir: m.dir });
      if (state.phase === "levelUp") state = continueAfterLevelUp(state);
      if (state.phase === "ended") break;
    }
    return state.score;
  } catch {
    return null;
  }
}
