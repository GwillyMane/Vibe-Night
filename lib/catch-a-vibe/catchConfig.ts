/** Catch A Vibe — swipe-catch arcade constants. */
import { GVC_COLOR_ACCENT, GVC_COLOR_LABELS } from "@/lib/assets/gvcLibraryFaces";

export const CATCH_GAME_ID = "catch-a-vibe" as const;
export const PRODUCT_TITLE = "CATCH A VIBE";
export const CATCH_LEVEL_ID = "catch";

export const CATCH_WORLD = {
  width: 520,
  height: 560,
  spawnMargin: 40,
  escapeTop: -70,
  escapeBottom: 640,
  /** Visible play band — vibes arc through here; bottom strip is launch lane. */
  playTop: 48,
  playBottom: 520,
} as const;

export const CATCH_DISPLAY_MAX_WIDTH = CATCH_WORLD.width;

/** Softer gravity + stronger launch so vibes reach the upper arena. */
export const GRAVITY = 0.26;
export const MAX_VELOCITY = 16;
export const LAUNCH_VY_MIN = 10;
export const LAUNCH_VY_MAX = 14.5;

export const COMBO_WINDOW_MS = 1400;
export const SWIPE_TOLERANCE = 22;
export const SWIPE_MAX_POINTS = 16;
export const MAX_ENTITIES = 24;
export const MAX_PARTICLES = 72;
export const MAX_MOTES = 14;
export const MAX_SHOCKWAVES = 8;

export const BLOOM_MIN_CHAIN = 3;
export const BLOOM_FULL_CHAIN = 7;
export const BLOOM_RADIUS = 110;

export const BAD_VIBE_MAX_STRIKES = 3;
/** Anti-cheat upper bound for survival time (ms) — runs end on lives, not a timer. */
export const MAX_RUN_MS = 600_000;

export const GOLD_SPAWN_CHANCE = 0.04;
/** Rare early; ramps to ~28% by ~3 min. */
export const BAD_SPAWN_BASE = 0.05;
export const BAD_SPAWN_RAMP_MS = 180_000;
export const BAD_SPAWN_MAX = 0.28;

/** Spawn interval tightens over this window; daily starts slightly hotter. */
export const SPAWN_PRESSURE_RAMP_MS = 120_000;
export const SPAWN_INTERVAL_START_CLASSIC = 1300;
export const SPAWN_INTERVAL_START_DAILY = 1050;
export const SPAWN_INTERVAL_MIN = 360;

export const BAD_VIBES_GUY_TOKEN_ID = 4113;
export const BAD_VIBE_RADIUS = 28;

/** 0–5 library colors; 6 = gold legendary */
export type CatchColorId = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type CatchVibeState = "normal" | "bad" | "golden" | "absorbing";

export interface CatchColorDef {
  id: CatchColorId;
  name: string;
  shortName: string;
  radius: number;
  accent: string;
  halo: "none" | "gold";
}

export const CATCH_COLORS: CatchColorDef[] = GVC_COLOR_LABELS.map((label, i) => ({
  id: i as CatchColorId,
  name: `${label} Vibe`,
  shortName: label,
  radius: 26,
  accent: GVC_COLOR_ACCENT[i],
  halo: "none" as const,
}));

export const GOLD_COLOR: CatchColorDef = {
  id: 6,
  name: "Golden Vibe",
  shortName: "Gold",
  radius: 30,
  accent: "#FFE048",
  halo: "gold",
};

export function colorDef(id: CatchColorId): CatchColorDef {
  if (id === 6) return GOLD_COLOR;
  return CATCH_COLORS[id] ?? CATCH_COLORS[0];
}

export function colorsMatch(a: CatchColorId, b: CatchColorId): boolean {
  if (a === 6 || b === 6) return true;
  return a === b;
}

export function badSpawnChance(elapsedMs: number): number {
  const t = Math.min(1, elapsedMs / BAD_SPAWN_RAMP_MS);
  return BAD_SPAWN_BASE + t * (BAD_SPAWN_MAX - BAD_SPAWN_BASE);
}
