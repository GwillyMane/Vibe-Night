/**
 * Level authoring helpers — Matter.js uses body **center** coords; **Y increases downward**.
 * Ground surface ≈ `worldGroundY()` (top of static ground slab).
 */
import type { BlockLevelDef, TargetLevelDef } from "./levels-types";
import { worldGroundY } from "./levels-types";
import { b, t } from "./levels-builders";

export const GROUND_Y = worldGroundY();
const PIT_Y = 560;

export function topOf(centerY: number, height: number): number {
  return centerY - height / 2;
}

export function bottomOf(centerY: number, height: number): number {
  return centerY + height / 2;
}

/** Center Y for a block resting on the ground surface. */
export function onGround(height: number): number {
  return GROUND_Y + height / 2;
}

/** Center Y for a block stacked on another block's top face. */
export function stackOn(topCenterY: number, topHeight: number, height: number): number {
  return topOf(topCenterY, topHeight) + height / 2;
}

/** Center Y for a circle target resting on a horizontal surface top. */
export function seatCircleOnSurface(surfaceTopY: number, radius: number): number {
  return surfaceTopY - radius;
}

export const DEFAULT_TARGET_CLEAR = {
  clearImpactThreshold: 1.88,
  clearCrushThreshold: 2.8,
  clearIfFallsBelowY: PIT_Y,
  clearJoltAngular: 16,
} as const;

export function badVibe(
  id: string,
  x: number,
  y: number,
  opts: Partial<TargetLevelDef> & { radius?: number } = {}
): TargetLevelDef {
  const radius = opts.radius ?? 14;
  return t({
    id,
    x,
    y,
    shape: "circle",
    targetType: "bad_vibe",
    ...DEFAULT_TARGET_CLEAR,
    ...opts,
    radius,
  });
}

export function badBox(
  id: string,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: Partial<TargetLevelDef> = {}
): TargetLevelDef {
  return t({
    id,
    x,
    y,
    shape: "box",
    width: w,
    height: h,
    targetType: "bad_vibe",
    clearImpactThreshold: 1.95,
    clearCrushThreshold: 2.9,
    clearIfFallsBelowY: PIT_Y,
    clearJoltAngular: 17,
    ...opts,
  });
}

/** Star thresholds scaled by target + block counts. */
export function starThresholds(targets: number, blocks: number, difficulty: "low" | "mid" | "high") {
  const base = targets * 520 + blocks * 40;
  const bump = difficulty === "low" ? 0 : difficulty === "mid" ? 200 : 450;
  return {
    twoStarsMin: Math.round(base * 0.72 + bump),
    threeStarsMin: Math.round(base * 1.15 + bump * 1.8),
  };
}

// --- Block presets (wrap `b`) ---

export function stoneAnchor(id: string, x: number, y: number, w: number, h: number, staticGround = false): BlockLevelDef {
  return b({
    id,
    x,
    y,
    width: w,
    height: h,
    material: "stone",
    role: "support",
    bodyType: staticGround ? "static" : "dynamic",
  });
}

export function crateSupport(id: string, x: number, y: number, w: number, h: number): BlockLevelDef {
  return b({ id, x, y, width: w, height: h, material: "crate", role: "support" });
}

export function metalBeam(id: string, x: number, y: number, w: number, h = 14): BlockLevelDef {
  return b({ id, x, y, width: w, height: h, material: "metal", role: "beam" });
}

export function glassBeam(
  id: string,
  x: number,
  y: number,
  w: number,
  h = 12,
  threshold = 2.15,
  role: BlockLevelDef["role"] = "beam"
): BlockLevelDef {
  return b({
    id,
    x,
    y,
    width: w,
    height: h,
    material: "glass",
    breakable: true,
    breakThreshold: threshold,
    role,
  });
}

export function fragilePost(id: string, x: number, y: number, h: number, w = 12, threshold = 1.9): BlockLevelDef {
  return b({
    id,
    x,
    y,
    width: w,
    height: h,
    material: "fragile",
    breakable: true,
    breakThreshold: threshold,
    role: "weakPoint",
  });
}

export function vibeCore(id: string, x: number, y: number, size: number, threshold = 1.95): BlockLevelDef {
  return b({
    id,
    x,
    y,
    width: size,
    height: size,
    material: "vibe_core",
    breakable: true,
    breakThreshold: threshold,
    role: "weakPoint",
  });
}

export function bouncePad(id: string, x: number, y: number, w: number, h: number): BlockLevelDef {
  return b({ id, x, y, width: w, height: h, material: "bounce", role: "decor" });
}

export function crateRamp(id: string, x: number, y: number, w: number, h: number, rotation: number): BlockLevelDef {
  return b({ id, x, y, width: w, height: h, material: "crate", rotation, role: "beam" });
}
