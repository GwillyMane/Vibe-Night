import type { Body } from "matter-js";

export type VibeBodyKind = "projectile" | "target" | "block" | "ground" | "wall" | "platform";

/** GVC structure materials — physics tuned in `materials.ts`, visuals in `matterBoardPaint.ts`. */
export type BlockMaterial = "stone" | "glass" | "crate" | "metal" | "bounce" | "fragile" | "vibe_core";

export interface TargetPhysicsMeta {
  clearImpactSpeed: number;
  clearCrushSpeed: number;
  clearIfFallsBelowY: number;
  /** Clear if angular speed exceeds this after a block contact (collapse “jolt”). */
  clearJoltAngular: number;
}

/** Cumulative blunt damage from blocks / landings — when exceeded, bad vibe pops. */
export const TARGET_IMPACT_DAMAGE_POP = 8;

export interface VibeBodyPlugin {
  vibe?: VibeBodyKind;
  blockMaterial?: BlockMaterial;
  blockId?: string;
  /** Authoring role from level data — debug overlay only. */
  blockRole?: string;
  targetId?: string;
  breakable?: boolean;
  breakThreshold?: number;
  targetPhysics?: TargetPhysicsMeta;
  /** Runtime: damage from non-projectile impacts (blocks, ground, platforms). */
  targetImpactDamageAccum?: number;
}

export function getVibeKind(body: Body): VibeBodyKind | undefined {
  const p = body.plugin as VibeBodyPlugin | undefined;
  return p?.vibe;
}

export function setVibeKind(body: Body, kind: VibeBodyKind): void {
  if (!body.plugin) body.plugin = {};
  (body.plugin as VibeBodyPlugin).vibe = kind;
}

export function setBlockMaterial(body: Body, material: BlockMaterial): void {
  if (!body.plugin) body.plugin = {};
  (body.plugin as VibeBodyPlugin).blockMaterial = material;
}

export function getBlockMaterial(body: Body): BlockMaterial {
  const m = (body.plugin as VibeBodyPlugin | undefined)?.blockMaterial;
  return m ?? "crate";
}

export function setTargetPhysics(body: Body, meta: TargetPhysicsMeta): void {
  if (!body.plugin) body.plugin = {};
  (body.plugin as VibeBodyPlugin).targetPhysics = meta;
}

export function getTargetPhysics(body: Body): TargetPhysicsMeta | undefined {
  return (body.plugin as VibeBodyPlugin | undefined)?.targetPhysics;
}

export function setTargetId(body: Body, id: string): void {
  if (!body.plugin) body.plugin = {};
  (body.plugin as VibeBodyPlugin).targetId = id;
}

export function getTargetImpactDamageAccum(body: Body): number {
  return (body.plugin as VibeBodyPlugin | undefined)?.targetImpactDamageAccum ?? 0;
}

/** Adds blunt damage; returns new total. */
export function addTargetImpactDamage(body: Body, amount: number): number {
  if (!body.plugin) body.plugin = {};
  const p = body.plugin as VibeBodyPlugin;
  const cur = p.targetImpactDamageAccum ?? 0;
  const next = cur + Math.max(0, amount);
  p.targetImpactDamageAccum = next;
  return next;
}

export function setBlockMeta(
  body: Body,
  meta: { blockId?: string; breakable?: boolean; breakThreshold?: number; blockRole?: string }
): void {
  if (!body.plugin) body.plugin = {};
  const p = body.plugin as VibeBodyPlugin;
  if (meta.blockId !== undefined) p.blockId = meta.blockId;
  if (meta.breakable !== undefined) p.breakable = meta.breakable;
  if (meta.breakThreshold !== undefined) p.breakThreshold = meta.breakThreshold;
  if (meta.blockRole !== undefined) p.blockRole = meta.blockRole;
}
