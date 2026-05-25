import {
  CLASSIC_SPIN_BUDGET,
  DAILY_SPIN_BUDGET,
  type LuckyMode,
} from "./luckyConfig";
import { countScatters, generateGrid, type Grid } from "./luckyGrid";
import { evaluateWays, type WayWin } from "./luckyWays";
import {
  computeDailyFinalScore,
  nextStreak,
  scatterTeasePoints,
  scoreSpin,
} from "./luckyScoring";
import { luckySpinsAward, runLuckySpinsFeature, type LuckySpinStepResult } from "./luckySpinsFeature";
import { runVibeLockFeature, shouldTriggerVibeLock, vibeLockTriggerGrid, type VibeLockStepResult } from "./luckyLockFeature";

export type LuckyPhase = "playing" | "ended";
export type LuckySubPhase = "idle" | "base" | "luckySpins" | "vibeLock";

export interface LuckyFeatureStats {
  luckySpinsTriggered: number;
  vibeLockTriggered: number;
  grandVibe: boolean;
  bestSingleSpin: number;
}

export interface LuckyMoveRecord {
  at: number;
  kind: "spin" | "feature";
  payload: Record<string, unknown>;
}

export interface LuckyRunState {
  mode: LuckyMode;
  phase: LuckyPhase;
  subPhase: LuckySubPhase;
  seed: string;
  spinIndex: number;
  spinsLeft: number;
  maxSpins: number;
  spinsUsed: number;
  score: number;
  streak: number;
  maxStreak: number;
  maxMultiplier: number;
  featureStats: LuckyFeatureStats;
  lastGrid: Grid | null;
  lastWins: WayWin[];
  lastSpinWin: number;
  moves: LuckyMoveRecord[];
  startedAt: number;
}

function spinBudget(mode: LuckyMode): number {
  if (mode === "zen") return 999_999;
  if (mode === "daily") return DAILY_SPIN_BUDGET;
  return CLASSIC_SPIN_BUDGET;
}

/** Unique per-run seed — every classic/daily/zen session gets its own board. */
export function newLuckyRunSeed(mode: LuckyMode): string {
  const suffix =
    typeof globalThis !== "undefined" &&
    globalThis.crypto &&
    typeof globalThis.crypto.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  return `${mode}-${suffix}`;
}

export function initClassicRun(runSeed?: string): LuckyRunState {
  return freshRun("classic", runSeed ?? newLuckyRunSeed("classic"));
}

export function initDailyRun(seed?: string): LuckyRunState {
  return freshRun("daily", seed ?? newLuckyRunSeed("daily"));
}

export function initZenRun(runSeed?: string): LuckyRunState {
  return freshRun("zen", runSeed ?? newLuckyRunSeed("zen"));
}

function freshRun(mode: LuckyMode, seed: string): LuckyRunState {
  const maxSpins = spinBudget(mode);
  return {
    mode,
    phase: "playing",
    subPhase: "idle",
    seed,
    spinIndex: 0,
    spinsLeft: maxSpins,
    maxSpins,
    spinsUsed: 0,
    score: 0,
    streak: 0,
    maxStreak: 0,
    maxMultiplier: 1,
    featureStats: {
      luckySpinsTriggered: 0,
      vibeLockTriggered: 0,
      grandVibe: false,
      bestSingleSpin: 0,
    },
    lastGrid: null,
    lastWins: [],
    lastSpinWin: 0,
    moves: [],
    startedAt: Date.now(),
  };
}

export interface SpinResult {
  state: LuckyRunState;
  grid: Grid;
  wins: WayWin[];
  spinWin: number;
  triggeredLuckySpins: boolean;
  triggeredVibeLock: boolean;
  /** Precomputed steps for UI playback (score already includes featureWin). */
  luckySpinsPlayback?: {
    steps: LuckySpinStepResult[];
    featureWin: number;
    scatterCount: number;
  };
  vibeLockPlayback?: {
    steps: VibeLockStepResult[];
    featureWin: number;
    grandVibe: boolean;
    triggerGrid: Grid;
  };
}

function recordMove(state: LuckyRunState, kind: LuckyMoveRecord["kind"], payload: Record<string, unknown>): LuckyMoveRecord[] {
  return [...state.moves, { at: state.moves.length, kind, payload }];
}

function endRunIfNeeded(state: LuckyRunState): LuckyRunState {
  if (state.mode === "zen") return state;
  if (state.spinsLeft <= 0) return { ...state, phase: "ended", subPhase: "idle" };
  return state;
}

export function applySpin(state: LuckyRunState): SpinResult {
  if (state.phase !== "playing" || state.spinsLeft <= 0) {
    return {
      state,
      grid: state.lastGrid ?? generateGrid(state.seed, 0, state.mode),
      wins: [],
      spinWin: 0,
      triggeredLuckySpins: false,
      triggeredVibeLock: false,
    };
  }

  const spinIndex = state.spinIndex;
  const grid = generateGrid(state.seed, spinIndex, state.mode, "base");
  const wins = evaluateWays(grid);
  const hadWin = wins.length > 0;

  let streak = nextStreak(state.streak, hadWin);
  const scored = scoreSpin(wins, streak);
  let spinWin = scored.spinTotal;
  let score = state.score + spinWin;
  let featureStats = { ...state.featureStats };
  let maxMultiplier = state.maxMultiplier;
  let maxStreak = Math.max(state.maxStreak, streak);
  let moves = recordMove(state, "spin", { i: spinIndex });

  const vibeLock = shouldTriggerVibeLock(grid);
  const scatterCount = countScatters(grid);
  let triggeredLuckySpins = false;
  let triggeredVibeLock = false;

  let luckySpinsResult: ReturnType<typeof runLuckySpinsFeature> | null = null;
  let vibeLockResult: ReturnType<typeof runVibeLockFeature> | null = null;

  if (vibeLock) {
    triggeredVibeLock = true;
    featureStats.vibeLockTriggered += 1;
    if (scatterCount >= 3) {
      spinWin += scatterTeasePoints(scatterCount);
      score += scatterTeasePoints(scatterCount);
    }
    vibeLockResult = runVibeLockFeature(state.seed, state.mode, grid, spinIndex);
    score += vibeLockResult.total;
    spinWin += vibeLockResult.total;
    if (vibeLockResult.grandVibe) featureStats.grandVibe = true;
    maxMultiplier = Math.max(maxMultiplier, vibeLockResult.maxMultiplier);
    moves = recordMove({ ...state, moves }, "feature", {
      type: "vibeLock",
      fromSpin: spinIndex,
      total: vibeLockResult.total,
      grand: vibeLockResult.grandVibe,
    });
  } else if (scatterCount >= 3) {
    triggeredLuckySpins = true;
    featureStats.luckySpinsTriggered += 1;
    luckySpinsResult = runLuckySpinsFeature(state.seed, state.mode, scatterCount);
    score += luckySpinsResult.totalWin;
    spinWin += luckySpinsResult.totalWin;
    maxMultiplier = Math.max(maxMultiplier, luckySpinsResult.maxMultiplier);
    moves = recordMove({ ...state, moves }, "feature", {
      type: "luckySpins",
      fromSpin: spinIndex,
      scatters: scatterCount,
      total: luckySpinsResult.totalWin,
    });
  }

  featureStats.bestSingleSpin = Math.max(featureStats.bestSingleSpin, spinWin);

  const spinsUsed = state.spinsUsed + 1;
  const spinsLeft = state.mode === "zen" ? state.spinsLeft : state.spinsLeft - 1;
  const spinIndexNext = spinIndex + 1;

  let next: LuckyRunState = {
    ...state,
    spinIndex: spinIndexNext,
    spinsLeft,
    spinsUsed,
    score,
    streak: hadWin ? streak : 0,
    maxStreak,
    maxMultiplier,
    featureStats,
    lastGrid: grid,
    lastWins: wins,
    lastSpinWin: spinWin,
    moves,
    subPhase: triggeredLuckySpins ? "luckySpins" : "idle",
  };

  next = endRunIfNeeded(next);
  if (next.phase === "ended" || !triggeredLuckySpins) {
    next = { ...next, subPhase: "idle" };
  }

  return {
    state: next,
    grid,
    wins,
    spinWin,
    triggeredLuckySpins,
    triggeredVibeLock,
    luckySpinsPlayback: luckySpinsResult
      ? {
          steps: luckySpinsResult.steps,
          featureWin: luckySpinsResult.totalWin,
          scatterCount,
        }
      : undefined,
    vibeLockPlayback: vibeLockResult
      ? {
          steps: vibeLockResult.steps,
          featureWin: vibeLockResult.total,
          grandVibe: vibeLockResult.grandVibe,
          triggerGrid: vibeLockTriggerGrid(grid),
        }
      : undefined,
  };
}

export function finalRunScore(state: LuckyRunState): number {
  if (state.mode !== "daily") return state.score;
  return computeDailyFinalScore(state.score, state.spinsUsed);
}

export function serializeMoves(moves: LuckyMoveRecord[]): string {
  return JSON.stringify(moves);
}

export function replayScore(seed: string, mode: LuckyMode, movesJson: string): number | null {
  try {
    const parsed = JSON.parse(movesJson) as LuckyMoveRecord[];
    let state = mode === "daily" ? initDailyRun(seed) : initClassicRun(seed);
    const spinMoves = parsed.filter((m) => m.kind === "spin");
    for (const _m of spinMoves) {
      if (state.phase === "ended") break;
      const result = applySpin(state);
      state = result.state;
    }
    return finalRunScore(state);
  } catch {
    return null;
  }
}

/** Classic run seed helper for deterministic tests. */
export function classicRunSeed(label: string): string {
  return `lucky-classic:${label}`;
}
