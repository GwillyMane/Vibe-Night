/** Big Vibes — merge game constants (original GVC arcade title). */
export const MERGE_GAME_ID = "vibe-merge" as const;
export const PRODUCT_TITLE = "BIG VIBES";
export const MERGE_LEVEL_ID = "merge";

/** GVC faces (1–6) + token art tiers 7–10. */
export const MERGE_MAX_TIER = 10;

/** GVC metadata token IDs for NFT merge tiers. */
export const MERGE_TIER_TOKEN_IDS = {
  7: "5275",
  8: "6731",
  9: "4889",
  10: "2943",
} as const;

/** Logical playfield — scales to fit mobile via CSS (see VibeMergeGame). */
export const MERGE_WORLD = {
  width: 520,
  height: 680,
  wallThickness: 26,
  floorInset: 32,
} as const;

/** CSS max width for the game column (matches world width on desktop). */
export const MERGE_DISPLAY_MAX_WIDTH = MERGE_WORLD.width;

export function mergeFloorY(): number {
  return MERGE_WORLD.height - MERGE_WORLD.floorInset;
}

/** Inner top inset (below border) where the spawn band begins. */
export const BIN_TOP = 52;

/** Largest spawn tier (classic/daily only spawn 1–3). */
export const MAX_SPAWN_TIER = 3 as const;

/** Continuous contact with the game-over line before loss. */
export const DANGER_OVERFLOW_MS = 3000;
export const DANGER_GRACE_MS = 1100;
/** Pixels past the line that still count as touching (subpixel / physics jitter). */
export const DANGER_LINE_TOUCH_SLACK = 4;
/** Minimum time between drops (stack must also settle). */
export const MIN_DROP_GAP_MS = 300;
export const COMBO_WINDOW_MS = 1400;
export const MAX_VELOCITY = 11;
/** Stack considered settled below this speed (reduces jittery re-drops). */
export const SETTLE_MAX_SPEED = 0.32;
export const SETTLE_ANGULAR_MAX = 0.12;
/** Brief grace after drop/merge spawn before demanding settle. */
export const SETTLE_GRACE_MS = 180;
export const ENGINE_GRAVITY = 1.08;

export type MergeTierId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface MergeTierDef {
  id: MergeTierId;
  name: string;
  shortName: string;
  radius: number;
  density: number;
  restitution: number;
  friction: number;
  frictionStatic: number;
  scoreOnMerge: number;
  /** Visual: none | gold | cosmic */
  halo: "none" | "gold" | "cosmic";
}

/**
 * Radii tuned for 520px-wide bin: tier 10 ≈ 40% of play width.
 */
export const MERGE_TIERS: MergeTierDef[] = [
  { id: 1, name: "Red Vibe", shortName: "Red", radius: 24, density: 0.00125, restitution: 0.07, friction: 0.62, frictionStatic: 0.78, scoreOnMerge: 12, halo: "none" },
  { id: 2, name: "Yellow Vibe", shortName: "Yellow", radius: 33, density: 0.00145, restitution: 0.065, friction: 0.64, frictionStatic: 0.8, scoreOnMerge: 28, halo: "none" },
  { id: 3, name: "Mint Vibe", shortName: "Mint", radius: 42, density: 0.00165, restitution: 0.06, friction: 0.66, frictionStatic: 0.82, scoreOnMerge: 50, halo: "none" },
  { id: 4, name: "Blue Vibe", shortName: "Blue", radius: 51, density: 0.0019, restitution: 0.055, friction: 0.68, frictionStatic: 0.84, scoreOnMerge: 80, halo: "none" },
  { id: 5, name: "Pink Vibe", shortName: "Pink", radius: 60, density: 0.0022, restitution: 0.05, friction: 0.7, frictionStatic: 0.86, scoreOnMerge: 130, halo: "none" },
  { id: 6, name: "Purple Vibe", shortName: "Purple", radius: 69, density: 0.0026, restitution: 0.045, friction: 0.72, frictionStatic: 0.88, scoreOnMerge: 220, halo: "none" },
  { id: 7, name: "Vibefoot", shortName: "Vibefoot", radius: 78, density: 0.003, restitution: 0.04, friction: 0.74, frictionStatic: 0.9, scoreOnMerge: 340, halo: "gold" },
  { id: 8, name: "Chill Vibes Guy", shortName: "Chill Guy", radius: 88, density: 0.0032, restitution: 0.035, friction: 0.75, frictionStatic: 0.91, scoreOnMerge: 500, halo: "gold" },
  { id: 9, name: "Candy Blob", shortName: "Candy Blob", radius: 98, density: 0.0035, restitution: 0.03, friction: 0.76, frictionStatic: 0.92, scoreOnMerge: 720, halo: "gold" },
  { id: 10, name: "Pebbles and Seeds", shortName: "Pebbles", radius: 106, density: 0.0038, restitution: 0.025, friction: 0.78, frictionStatic: 0.93, scoreOnMerge: 1000, halo: "cosmic" },
];

export function tierDef(tier: number): MergeTierDef {
  return MERGE_TIERS[Math.min(MERGE_MAX_TIER, Math.max(1, tier)) - 1]!;
}

/**
 * Launcher center Y — top of bin (smaller Y = higher on screen).
 * Must stay above `DANGER_Y` (game-over line sits lower on the canvas).
 */
export function dropLineY(): number {
  return BIN_TOP + 22;
}

/** Drop line Y — keep in sync with `dropLineY()`. */
export const DROP_LINE_Y = BIN_TOP + 22;

/**
 * Game-over line (larger Y = lower on screen, below the dropper).
 * Loss when a piece's top (centerY − radius) touches this line for `DANGER_OVERFLOW_MS`.
 */
export function dangerLineY(): number {
  const spawn = tierDef(MAX_SPAWN_TIER);
  return dropLineY() + spawn.radius + 36;
}

export const DANGER_Y = BIN_TOP + 22 + MERGE_TIERS[MAX_SPAWN_TIER - 1]!.radius + 36;

/** Spawn weights for classic mode (tiers 1–3 only). */
export const SPAWN_WEIGHTS: { tier: MergeTierId; weight: number }[] = [
  { tier: 1, weight: 45 },
  { tier: 2, weight: 35 },
  { tier: 3, weight: 20 },
];

export const AIM_PAD_X = 24;
