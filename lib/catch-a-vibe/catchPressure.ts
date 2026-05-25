import { BAD_VIBE_MAX_STRIKES } from "./catchConfig";

export interface CatchRunState {
  catches: number;
  misses: number;
  badStrikes: number;
  badDodged: number;
}

export function initRunState(): CatchRunState {
  return { catches: 0, misses: 0, badStrikes: 0, badDodged: 0 };
}

export function applyBadCatch(state: CatchRunState): boolean {
  state.badStrikes += 1;
  return state.badStrikes >= BAD_VIBE_MAX_STRIKES;
}

export function applyGoodMiss(state: CatchRunState) {
  state.misses += 1;
}

export function applyBadDodge(state: CatchRunState) {
  state.badDodged += 1;
}

export function applyGoodCatch(state: CatchRunState) {
  state.catches += 1;
}
