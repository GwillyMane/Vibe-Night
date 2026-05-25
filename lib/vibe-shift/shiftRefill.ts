import { seededRandom } from "@/lib/daily-seed";
import type { Board } from "./shiftBoard";
import { gravityAndRefill, type FallMove } from "./shiftGravity";
import { clearMatches, findMatches, type MatchGroup } from "./shiftMatch";
import { scoreMatchGroups } from "./shiftScoring";

export function createRefillRand(seed: string): () => number {
  return seededRandom(`shift-refill:${seed}`);
}

export interface CascadeStepDetail {
  cascadeIndex: number;
  board: Board;
  groups: MatchGroup[];
  coords: { r: number; c: number }[];
  scoreDelta: number;
  /** Board with matched cells nulled — before gravity. */
  boardCleared: Board;
  falls: FallMove[];
  boardAfter: Board;
}

export interface CascadeResult {
  board: Board;
  totalCleared: number;
  cascadeSteps: number;
  scoreFromCells: number;
  steps: CascadeStepDetail[];
}

export function runCascadeLoop(board: Board, refillSeedPrefix: string): CascadeResult {
  let current = board.map((row) => [...row]);
  let totalCleared = 0;
  let cascadeSteps = 0;
  let scoreFromCells = 0;
  const steps: CascadeStepDetail[] = [];

  while (true) {
    const { coords, cellCount, groups } = findMatches(current);
    if (cellCount === 0) break;
    cascadeSteps++;
    totalCleared += cellCount;
    const scoreDelta = scoreMatchGroups(groups, cascadeSteps);
    scoreFromCells += scoreDelta;
    const boardBefore = current.map((row) => [...row]);
    const boardCleared = clearMatches(current, coords);
    const refillRand = seededRandom(`${refillSeedPrefix}:c${cascadeSteps}`);
    const { board: boardAfter, falls } = gravityAndRefill(boardCleared, refillRand);
    current = boardAfter;
    steps.push({
      cascadeIndex: cascadeSteps,
      board: boardBefore,
      groups,
      coords,
      scoreDelta,
      boardCleared: boardCleared.map((row) => [...row]),
      falls,
      boardAfter: boardAfter.map((row) => [...row]),
    });
  }

  return { board: current, totalCleared, cascadeSteps, scoreFromCells, steps };
}
