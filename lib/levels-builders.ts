import type { BlockLevelDef, TargetLevelDef, StructureBodyType } from "./levels-types";

export function b(
  p: Omit<BlockLevelDef, "bodyType" | "rotation"> & { rotation?: number; bodyType?: StructureBodyType }
): BlockLevelDef {
  return {
    bodyType: p.bodyType ?? "dynamic",
    rotation: p.rotation ?? 0,
    breakable: p.breakable,
    breakThreshold: p.breakThreshold,
    health: p.health,
    renderStyle: p.renderStyle,
    role: p.role,
    density: p.density,
    friction: p.friction,
    frictionStatic: p.frictionStatic,
    restitution: p.restitution,
    id: p.id,
    x: p.x,
    y: p.y,
    width: p.width,
    height: p.height,
    material: p.material,
  };
}

export function t(p: TargetLevelDef): TargetLevelDef {
  return p;
}
