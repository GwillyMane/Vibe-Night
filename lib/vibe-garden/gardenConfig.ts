/** Vibe Garden — ecosystem physics puzzle constants. */
export const GARDEN_GAME_ID = "vibe-garden" as const;
export const PRODUCT_TITLE = "VIBE GARDEN";
export const GARDEN_LEVEL_ID = "garden";

export const GARDEN_WORLD = {
  width: 520,
  height: 560,
  wallThickness: 26,
  bowlInset: 36,
} as const;

export const GARDEN_DISPLAY_MAX_WIDTH = GARDEN_WORLD.width;

export const ENGINE_GRAVITY = 0.52;
export const MAX_VELOCITY = 7.5;
export const MIN_PLANT_GAP_MS = 400;
export const COMBO_WINDOW_MS = 1600;
export const MAX_ENTITIES = 28;
export const MAX_PARTICLES = 72;
export const MAX_MOTES = 14;
export const MAX_SHOCKWAVES = 8;
export const BLOOM_MAX_HOPS = 4;
export const BLOOM_MAX_HOPS_PINK = 6;
export const BLOOM_RADIUS_MULT = 2.18;
export const BLOOM_MIN_POP_CHAIN = 3;
export const BLOOM_POP_DELAY_MS = 420;
export const BLOOM_CLEANSE_POP_MS = 280;
export const BLOOM_FULL_POP_CHAIN = 7;
export const PROXIMITY_REBUILD_EVERY = 3;

export const CORRUPTION_MAX = 100;
export const STABILITY_MAX = 100;
export const CORRUPTION_WARN = 52;
export const STABILITY_WARN = 45;
export const CORRUPTION_SPAWN_MS = 16_000;
export const CORRUPTION_SPREAD_MS = 2800;
export const STABILITY_COLLAPSE_CORRUPTION_MIN = 25;
export const STABILITY_CROWD_COUNT = 22;
export const DAILY_RUN_MS = 90_000;
export const CLASSIC_GRACE_MS = 8_000;

export const GOLD_SPAWN_CHANCE = 0.03;

/** 0–5 library colors; 6 = gold; -1 = corrupted */
export type GardenColorId = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type GardenEntityState = "normal" | "blooming" | "corrupted";

export interface GardenColorDef {
  id: GardenColorId;
  name: string;
  shortName: string;
  radius: number;
  density: number;
  restitution: number;
  friction: number;
  frictionStatic: number;
  accent: string;
  /** Bloom push force (red). */
  pushForce: number;
  /** Corruption resist 0–1 (blue/mint). */
  corruptionResist: number;
  /** Bloom radius multiplier (yellow/pink). */
  bloomMult: number;
  /** Extra bloom hops (pink). */
  extraHops: number;
  /** Combo amplify (yellow). */
  amplifyMult: number;
  halo: "none" | "gold";
}

export const GARDEN_COLORS: GardenColorDef[] = [
  {
    id: 0,
    name: "Red Vibe",
    shortName: "Red",
    radius: 22,
    density: 0.0011,
    restitution: 0.14,
    friction: 0.58,
    frictionStatic: 0.72,
    accent: "#FF5F1F",
    pushForce: 0.0042,
    corruptionResist: 0,
    bloomMult: 1,
    extraHops: 0,
    amplifyMult: 1,
    halo: "none",
  },
  {
    id: 1,
    name: "Yellow Vibe",
    shortName: "Yellow",
    radius: 24,
    density: 0.0012,
    restitution: 0.12,
    friction: 0.6,
    frictionStatic: 0.74,
    accent: "#FFE048",
    pushForce: 0.002,
    corruptionResist: 0.05,
    bloomMult: 1.25,
    extraHops: 0,
    amplifyMult: 1.5,
    halo: "none",
  },
  {
    id: 2,
    name: "Mint Vibe",
    shortName: "Mint",
    radius: 23,
    density: 0.00115,
    restitution: 0.1,
    friction: 0.52,
    frictionStatic: 0.68,
    accent: "#2EFF2E",
    pushForce: 0.0015,
    corruptionResist: 0.35,
    bloomMult: 1,
    extraHops: 0,
    amplifyMult: 1,
    halo: "none",
  },
  {
    id: 3,
    name: "Blue Vibe",
    shortName: "Blue",
    radius: 26,
    density: 0.00185,
    restitution: 0.06,
    friction: 0.68,
    frictionStatic: 0.82,
    accent: "#6B9DFF",
    pushForce: 0.0008,
    corruptionResist: 0.45,
    bloomMult: 1,
    extraHops: 0,
    amplifyMult: 1,
    halo: "none",
  },
  {
    id: 4,
    name: "Pink Vibe",
    shortName: "Pink",
    radius: 23,
    density: 0.0012,
    restitution: 0.16,
    friction: 0.55,
    frictionStatic: 0.7,
    accent: "#FF6B9D",
    pushForce: 0.0025,
    corruptionResist: 0.08,
    bloomMult: 1.15,
    extraHops: 2,
    amplifyMult: 1.1,
    halo: "none",
  },
  {
    id: 5,
    name: "Purple Vibe",
    shortName: "Purple",
    radius: 24,
    density: 0.00125,
    restitution: 0.11,
    friction: 0.62,
    frictionStatic: 0.76,
    accent: "#B06BFF",
    pushForce: 0.002,
    corruptionResist: 0.1,
    bloomMult: 1.1,
    extraHops: 0,
    amplifyMult: 1,
    halo: "none",
  },
  {
    id: 6,
    name: "Gold Vibe",
    shortName: "Gold",
    radius: 30,
    density: 0.0015,
    restitution: 0.1,
    friction: 0.58,
    frictionStatic: 0.74,
    accent: "#FFE048",
    pushForce: 0.0035,
    corruptionResist: 0.25,
    bloomMult: 1.8,
    extraHops: 2,
    amplifyMult: 2,
    halo: "gold",
  },
];

export function colorDef(id: GardenColorId): GardenColorDef {
  return GARDEN_COLORS[id === 6 ? 6 : id]!;
}

export function bowlFloorY(): number {
  return GARDEN_WORLD.height - GARDEN_WORLD.bowlInset;
}

export function isInsideGardenSoil(x: number, y: number): boolean {
  const w = GARDEN_WORLD.width;
  const floor = bowlFloorY();
  const inset = GARDEN_WORLD.bowlInset + 20;
  if (y < 80 || y > floor - 8) return false;
  if (x < inset || x > w - inset) return false;
  return true;
}
