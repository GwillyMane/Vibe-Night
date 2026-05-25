import { COMBO_WINDOW_MS, colorsMatch, type CatchColorId } from "./catchConfig";

export interface ComboState {
  count: number;
  lastColor: CatchColorId | null;
  lastAt: number;
  maxCombo: number;
}

export function initComboState(): ComboState {
  return { count: 0, lastColor: null, lastAt: 0, maxCombo: 0 };
}

export function resetCombo(state: ComboState) {
  state.count = 0;
  state.lastColor = null;
}

export function registerCatch(
  state: ComboState,
  colorId: CatchColorId,
  now: number
): { combo: number; reset: boolean; continued: boolean } {
  const gap = now - state.lastAt;
  const continued =
    state.lastColor !== null &&
    gap <= COMBO_WINDOW_MS &&
    colorsMatch(state.lastColor, colorId);

  if (continued) {
    state.count += 1;
  } else {
    state.count = 1;
  }
  state.lastColor = colorId;
  state.lastAt = now;
  state.maxCombo = Math.max(state.maxCombo, state.count);
  return { combo: state.count, reset: !continued && state.count === 1, continued };
}

export function milestoneLabel(combo: number): string | null {
  if (combo >= 25) return "LEGENDARY VIBES";
  if (combo === 15) return "PERFECT CATCH";
  if (combo >= 10) return "BLOOM FRENZY";
  if (combo >= 7) return "GOLDEN CASCADE";
  if (combo >= 5) return `VIBE CHAIN x${combo}`;
  if (combo >= 3 && combo % 3 === 0) return `VIBE CHAIN x${combo}`;
  return null;
}

export function isFullBloom(combo: number): boolean {
  return combo >= 7;
}

export function isBloomChain(combo: number): boolean {
  return combo >= 3;
}
