import type { BlockMaterial } from "./collisions";

/** Matter.js tuning per GVC structure material — applied to real bodies, not only paint. */
export function matterOptionsForBlockMaterial(material: BlockMaterial): {
  density: number;
  friction: number;
  frictionStatic: number;
  restitution: number;
} {
  switch (material) {
    case "stone":
      return {
        density: 0.0046,
        friction: 0.64,
        frictionStatic: 0.78,
        restitution: 0.05,
      };
    case "metal":
      return {
        density: 0.0052,
        friction: 0.45,
        frictionStatic: 0.65,
        restitution: 0.05,
      };
    case "crate":
      return {
        density: 0.0025,
        friction: 0.56,
        frictionStatic: 0.74,
        restitution: 0.09,
      };
    case "glass":
      return {
        density: 0.0016,
        friction: 0.32,
        frictionStatic: 0.5,
        restitution: 0.12,
      };
    case "fragile":
      return {
        density: 0.0014,
        friction: 0.38,
        frictionStatic: 0.55,
        restitution: 0.14,
      };
    case "bounce":
      return {
        density: 0.002,
        friction: 0.42,
        frictionStatic: 0.55,
        restitution: 0.42,
      };
    case "vibe_core":
      return {
        density: 0.0022,
        friction: 0.4,
        frictionStatic: 0.52,
        restitution: 0.22,
      };
    default:
      return {
        density: 0.002,
        friction: 0.55,
        frictionStatic: 0.7,
        restitution: 0.1,
      };
  }
}

/** Default crush rule: relative speed along collision normal (approx). */
export const DEFAULT_TARGET_CLEAR_IMPACT = 2.4;
export const DEFAULT_TARGET_CLEAR_CRUSH = 3.2;

/** Bad-vibe targets — dynamic bodies that roll/slide with the stack. */
export function matterOptionsForBadVibeTarget(overrides?: {
  density?: number;
  friction?: number;
  frictionStatic?: number;
  restitution?: number;
}): { density: number; friction: number; frictionStatic: number; restitution: number } {
  return {
    density: overrides?.density ?? 0.00125,
    friction: overrides?.friction ?? 0.48,
    frictionStatic: overrides?.frictionStatic ?? 0.62,
    restitution: overrides?.restitution ?? 0.12,
  };
}
