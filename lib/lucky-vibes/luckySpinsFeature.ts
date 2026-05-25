import {
  CHAMPION_FLAT_BONUS,
  LUCKY_SPINS_EXPANDED_REELS,
  LUCKY_SPINS_RETRIGGER,
  LUCKY_SPINS_START_MULTIPLIER,
  MAX_LUCKY_MULTIPLIER,
  SCATTER_LUCKY_SPINS,
  type LuckyMode,
} from "./luckyConfig";
import { generateGrid, gridHasToken, countScatters, type Grid } from "./luckyGrid";
import { evaluateWays, totalWayPoints, type WayWin } from "./luckyWays";

export interface LuckySpinsState {
  spinsLeft: number;
  multiplier: number;
  totalFeatureWin: number;
  spinIndex: number;
}

export function luckySpinsAward(scatterCount: number): number {
  if (scatterCount >= 6) return SCATTER_LUCKY_SPINS[6]!;
  if (scatterCount >= 5) return SCATTER_LUCKY_SPINS[5]!;
  if (scatterCount >= 4) return SCATTER_LUCKY_SPINS[4]!;
  if (scatterCount >= 3) return SCATTER_LUCKY_SPINS[3]!;
  return 0;
}

export function initLuckySpins(scatterCount: number): LuckySpinsState {
  return {
    spinsLeft: luckySpinsAward(scatterCount),
    multiplier: LUCKY_SPINS_START_MULTIPLIER,
    totalFeatureWin: 0,
    spinIndex: 0,
  };
}

export interface LuckySpinStepResult {
  grid: Grid;
  wins: WayWin[];
  spinWin: number;
  multiplierAfter: number;
  premiumBonus: number;
  retriggerSpins: number;
  done: boolean;
  expandedReels: number[];
  state: LuckySpinsState;
}

function expandedReelsForMultiplier(mult: number): number[] {
  if (mult >= 12) return [0, 1, 2, 3, 4, 5];
  if (mult >= 8) return [1, 2, 3, 4];
  return [...LUCKY_SPINS_EXPANDED_REELS];
}

function premiumBoosts(grid: Grid): { multAdd: number; flat: number } {
  let multAdd = 0;
  let flat = 0;
  if (gridHasToken(grid, "1400")) {
    multAdd += 2;
    flat += CHAMPION_FLAT_BONUS;
  } else if (gridHasToken(grid, "1151")) {
    multAdd += 1;
  } else if (gridHasToken(grid, "430")) {
    multAdd += 1;
  }
  return { multAdd, flat };
}

/** Execute one Lucky Spins bonus spin; mutates logical state via return. */
export function stepLuckySpin(
  seed: string,
  mode: LuckyMode,
  state: LuckySpinsState
): LuckySpinStepResult {
  const spinIdx = state.spinIndex;
  const grid = generateGrid(seed, 10000 + spinIdx, mode, "luckySpins");
  const wins = evaluateWays(grid);
  const baseWin = totalWayPoints(wins);
  const hadWin = baseWin > 0;

  let multiplier = state.multiplier;
  if (hadWin) multiplier = Math.min(MAX_LUCKY_MULTIPLIER, multiplier + 1);

  const { multAdd, flat } = premiumBoosts(grid);
  multiplier = Math.min(MAX_LUCKY_MULTIPLIER, multiplier + multAdd);

  const spinWin = Math.floor(baseWin * multiplier) + flat;

  let retriggerSpins = 0;
  const scatters = countScatters(grid);
  if (scatters >= 3) retriggerSpins = LUCKY_SPINS_RETRIGGER;

  const spinsLeft = state.spinsLeft - 1 + retriggerSpins;
  const next: LuckySpinsState = {
    spinsLeft,
    multiplier,
    totalFeatureWin: state.totalFeatureWin + spinWin,
    spinIndex: spinIdx + 1,
  };

  return {
    grid,
    wins,
    spinWin,
    multiplierAfter: multiplier,
    premiumBonus: flat,
    retriggerSpins,
    done: spinsLeft <= 0,
    expandedReels: expandedReelsForMultiplier(multiplier),
    state: next,
  };
}

/** Run entire Lucky Spins feature synchronously. */
export function runLuckySpinsFeature(
  seed: string,
  mode: LuckyMode,
  scatterCount: number
): { totalWin: number; maxMultiplier: number; steps: LuckySpinStepResult[] } {
  let state = initLuckySpins(scatterCount);
  const steps: LuckySpinStepResult[] = [];
  let maxMultiplier = LUCKY_SPINS_START_MULTIPLIER;

  while (state.spinsLeft > 0) {
    const step = stepLuckySpin(seed, mode, state);
    steps.push(step);
    state = step.state;
    maxMultiplier = Math.max(maxMultiplier, step.multiplierAfter);
    if (step.done) break;
  }

  return { totalWin: state.totalFeatureWin, maxMultiplier, steps };
}

export function hasSixWayChampion(wins: WayWin[]): boolean {
  return wins.some((w) => w.symbol === "token:1400" && w.reelCount === 6);
}
