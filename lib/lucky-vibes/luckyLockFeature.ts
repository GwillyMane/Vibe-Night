import {
  GRAND_VIBE_BONUS,
  ORB_VALUE_PTS,
  ROWS,
  TOTAL_CELLS,
  VIBE_LOCK_MIN_ORBS,
  VIBE_LOCK_RESPINS,
  type LuckyMode,
  type OrbValueKind,
} from "./luckyConfig";
import {
  allCells,
  cellKey,
  countOrbs,
  createBlankGrid,
  createEmptyGrid,
  gridFromVibeLockState,
  type CellCoord,
  type Grid,
} from "./luckyGrid";
import { drawOrbValue, drawSymbol } from "./luckyRng";

export interface LockedOrb {
  coord: CellCoord;
  valueKind: OrbValueKind;
  points: number;
}

export interface VibeLockState {
  locked: LockedOrb[];
  respinsLeft: number;
  lockStep: number;
  triggerSpinIndex: number;
}

export function initVibeLockFromGrid(grid: Grid, seed: string, triggerSpinIndex: number): VibeLockState {
  const locked: LockedOrb[] = [];
  let idx = 0;
  for (let r = 0; r < grid.length; r++) {
    for (let y = 0; y < grid[r]!.length; y++) {
      if (grid[r]![y] === "orb") {
        const kind = drawOrbValue(seed, 0, idx);
        locked.push({
          coord: { reel: r, row: y },
          valueKind: kind,
          points: ORB_VALUE_PTS[kind],
        });
        idx++;
      }
    }
  }
  return {
    locked,
    respinsLeft: VIBE_LOCK_RESPINS,
    lockStep: 0,
    triggerSpinIndex,
  };
}

function lockedKeySet(state: VibeLockState): Set<string> {
  return new Set(state.locked.map((o) => cellKey(o.coord)));
}

export interface VibeLockStepResult {
  newOrbs: LockedOrb[];
  respinsLeft: number;
  respinsLeftBefore: number;
  done: boolean;
  state: VibeLockState;
  /** Grid after this respin — locked Craig + blank empty cells. */
  gridAfter: Grid;
  /** Empty cells that were rolled this respin. */
  rolledKeys: string[];
}

export function stepVibeLockRespin(
  seed: string,
  mode: LuckyMode,
  state: VibeLockState
): VibeLockStepResult {
  const keys = lockedKeySet(state);
  const empty = allCells().filter((c) => !keys.has(cellKey(c)));
  const newOrbs: LockedOrb[] = [];
  const rolledKeys: string[] = [];
  const step = state.lockStep + 1;
  const respinsLeftBefore = state.respinsLeft;

  for (const c of empty) {
    rolledKeys.push(cellKey(c));
    const sym = drawSymbol(
      seed,
      state.triggerSpinIndex * 1000 + step,
      c.reel,
      c.row,
      "vibeLock",
      mode
    );
    if (sym === "orb") {
      const kind = drawOrbValue(seed, step, newOrbs.length + state.locked.length);
      newOrbs.push({
        coord: c,
        valueKind: kind,
        points: ORB_VALUE_PTS[kind],
      });
    }
  }

  let respinsLeft = state.respinsLeft - 1;
  if (newOrbs.length > 0) respinsLeft = VIBE_LOCK_RESPINS;

  const locked = [...state.locked, ...newOrbs];
  const done = respinsLeft <= 0 || locked.length >= TOTAL_CELLS;

  const next: VibeLockState = {
    locked,
    respinsLeft,
    lockStep: step,
    triggerSpinIndex: state.triggerSpinIndex,
  };

  return {
    newOrbs,
    respinsLeft,
    respinsLeftBefore,
    done,
    state: next,
    gridAfter: gridFromVibeLockState(locked),
    rolledKeys,
  };
}

export function finalizeVibeLock(state: VibeLockState): {
  orbTotal: number;
  fillMultiplier: number;
  grandVibe: boolean;
  total: number;
} {
  const orbCount = state.locked.length;
  let orbTotal = state.locked.reduce((s, o) => s + o.points, 0);

  let fillMultiplier = 1;
  if (orbCount >= TOTAL_CELLS) fillMultiplier = 2.5;
  else if (orbCount >= 22) fillMultiplier = 1.75;
  else if (orbCount >= 15) fillMultiplier = 1.4;
  else if (orbCount >= 8) fillMultiplier = 1.15;

  const grandVibe = orbCount >= TOTAL_CELLS;
  let total = Math.floor(orbTotal * fillMultiplier);
  if (grandVibe) total += GRAND_VIBE_BONUS;

  return { orbTotal, fillMultiplier, grandVibe, total };
}

export function runVibeLockFeature(
  seed: string,
  mode: LuckyMode,
  triggerGrid: Grid,
  triggerSpinIndex: number
): { total: number; grandVibe: boolean; maxMultiplier: number; steps: VibeLockStepResult[] } {
  let state = initVibeLockFromGrid(triggerGrid, seed, triggerSpinIndex);
  const steps: VibeLockStepResult[] = [];

  while (state.respinsLeft > 0 && state.locked.length < TOTAL_CELLS) {
    const step = stepVibeLockRespin(seed, mode, state);
    steps.push(step);
    state = step.state;
    if (step.done) break;
  }

  const fin = finalizeVibeLock(state);
  return {
    total: fin.total,
    grandVibe: fin.grandVibe,
    maxMultiplier: fin.fillMultiplier,
    steps,
  };
}

export function shouldTriggerVibeLock(grid: Grid): boolean {
  return countOrbs(grid) >= VIBE_LOCK_MIN_ORBS;
}

/** Grid at feature start — trigger Craig locked, everything else blank. */
export function vibeLockTriggerGrid(triggerGrid: Grid): Grid {
  const grid = createBlankGrid();
  for (let r = 0; r < triggerGrid.length; r++) {
    for (let y = 0; y < triggerGrid[r]!.length; y++) {
      if (triggerGrid[r]![y] === "orb") grid[r]![y] = "orb";
    }
  }
  return grid;
}

/** Fill grid with orbs for testing. */
export function gridWithOrbs(count: number): Grid {
  const grid = createEmptyGrid();
  let placed = 0;
  for (let r = 0; r < grid.length && placed < count; r++) {
    for (let y = 0; y < grid[r]!.length && placed < count; y++) {
      grid[r]![y] = "orb";
      placed++;
    }
  }
  return grid;
}

/** Locked keys for all Craig cells on a grid. */
export function orbKeysFromGrid(grid: Grid): Set<string> {
  const keys = new Set<string>();
  for (let r = 0; r < grid.length; r++) {
    for (let y = 0; y < ROWS; y++) {
      if (grid[r]![y] === "orb") keys.add(cellKey({ reel: r, row: y }));
    }
  }
  return keys;
}
