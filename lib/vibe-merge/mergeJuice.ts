import Matter from "matter-js";
import type { MergePiecePlugin } from "./mergePhysics";

export interface MergeBurst {
  x: number;
  y: number;
  tier: number;
  life: number;
  maxLife: number;
}

export interface MergeFloatLabel {
  text: string;
  x: number;
  y: number;
  life: number;
  vy: number;
  pop: number;
  combo: number;
  big: boolean;
}

export function createFloatLabel(
  text: string,
  x: number,
  y: number,
  combo: number,
  big: boolean
): MergeFloatLabel {
  return {
    text,
    x,
    y: y - 8,
    life: 1,
    vy: -0.9 - combo * 0.15,
    pop: 1.35,
    combo,
    big,
  };
}

export function tickFloatLabels(labels: MergeFloatLabel[], dt: number): MergeFloatLabel[] {
  const decay = 0.018 * (dt / 16.67);
  const out: MergeFloatLabel[] = [];
  for (const f of labels) {
    f.life -= decay;
    f.y += f.vy * (dt / 16.67);
    f.vy *= 0.98;
    f.pop += (1 - f.pop) * 0.14;
    if (f.life > 0) out.push(f);
  }
  return out;
}

export function tickMergeBursts(bursts: MergeBurst[], dt: number): MergeBurst[] {
  const out: MergeBurst[] = [];
  for (const b of bursts) {
    b.life -= dt / b.maxLife;
    if (b.life > 0) out.push(b);
  }
  return out;
}

export function pluginJuice(body: Matter.Body): MergePiecePlugin {
  return body.plugin as MergePiecePlugin;
}

export function applyImpactJuice(a: Matter.Body, b: Matter.Body) {
  const pa = pluginJuice(a);
  const pb = pluginJuice(b);
  const rel = Matter.Vector.sub(b.velocity, a.velocity);
  const impact = Matter.Vector.magnitude(rel);
  if (impact < 0.55) return;
  const squash = Math.min(1, impact / 9);
  pa.juiceSquash = Math.max(pa.juiceSquash ?? 0, squash);
  pb.juiceSquash = Math.max(pb.juiceSquash ?? 0, squash);
}

export function applyMergeSpawnJuice(body: Matter.Body, tier: number) {
  const p = pluginJuice(body);
  p.juicePop = 1;
  p.juiceSquash = 0.42;
  p.mergeFlash = 1;
  p.juiceTier = tier;
}

export function decayBodyJuice(body: Matter.Body, dt: number) {
  const p = pluginJuice(body);
  const k = 0.11 * (dt / 16.67);
  if (p.juicePop) p.juicePop = Math.max(0, p.juicePop - k * 1.4);
  if (p.juiceSquash) p.juiceSquash = Math.max(0, p.juiceSquash - k);
  if (p.mergeFlash) p.mergeFlash = Math.max(0, p.mergeFlash - k * 1.8);
}

export function squashScale(
  p: MergePiecePlugin,
  vy = 0
): { sx: number; sy: number } {
  const sq = p.juiceSquash ?? 0;
  const pop = p.juicePop ?? 0;
  const fall = Math.min(0.22, Math.max(0, vy) * 0.04);
  const sx = 1 + sq * 0.14 + pop * 0.12 - fall;
  const sy = 1 - sq * 0.18 - pop * 0.08 + fall;
  return { sx, sy };
}
