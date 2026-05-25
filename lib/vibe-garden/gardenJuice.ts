import type { GardenColorId } from "./gardenConfig";
import { colorDef } from "./gardenConfig";

export interface GardenFloatLabel {
  text: string;
  x: number;
  y: number;
  life: number;
  maxLife: number;
  pop: number;
  combo: number;
  big?: boolean;
}

export interface GardenBurst {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  colorId: GardenColorId;
  radius: number;
}

export interface GardenParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export type ShockwaveKind = "bloom" | "full" | "corrupt" | "calm";

export interface GardenShockwave {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  maxRadius: number;
  kind: ShockwaveKind;
  colorId: GardenColorId;
}

export interface GardenMote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

export function createFloatLabel(
  text: string,
  x: number,
  y: number,
  combo = 1,
  big = false
): GardenFloatLabel {
  return { text, x, y: y - 8, life: 1, maxLife: 1, pop: big ? 1.35 : 1.15, combo, big };
}

export function tickFloatLabels(labels: GardenFloatLabel[], dt: number): GardenFloatLabel[] {
  const decay = dt / (900 + dt * 0.5);
  return labels
    .map((f) => {
      f.life -= decay;
      f.y -= dt * (f.big ? 0.045 : 0.035);
      f.pop = 0.82 + f.life * (f.big ? 0.5 : 0.35);
      return f;
    })
    .filter((f) => f.life > 0);
}

export function createBurst(x: number, y: number, colorId: GardenColorId, radius: number): GardenBurst {
  return { x, y, life: 1, maxLife: 1, colorId, radius };
}

export function tickBursts(bursts: GardenBurst[], dt: number): GardenBurst[] {
  const decay = dt / 480;
  return bursts.map((b) => ({ ...b, life: b.life - decay })).filter((b) => b.life > 0);
}

export function createShockwave(
  x: number,
  y: number,
  maxRadius: number,
  kind: ShockwaveKind,
  colorId: GardenColorId = 1
): GardenShockwave {
  const maxLife = kind === "full" ? 1.35 : kind === "corrupt" ? 0.95 : 0.75;
  return { x, y, life: maxLife, maxLife, maxRadius, kind, colorId };
}

export function tickShockwaves(waves: GardenShockwave[], dt: number): GardenShockwave[] {
  const decay = dt / 680;
  return waves.map((w) => ({ ...w, life: w.life - decay })).filter((w) => w.life > 0);
}

export function spawnParticles(
  particles: GardenParticle[],
  x: number,
  y: number,
  color: string,
  count: number,
  cap: number
): GardenParticle[] {
  const out = [...particles];
  for (let i = 0; i < count && out.length < cap; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 0.6 + Math.random() * 2.8;
    out.push({
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: 1,
      maxLife: 1,
      color,
      size: 1.5 + Math.random() * 3.5,
    });
  }
  return out.slice(-cap);
}

export function spawnBloomParticles(
  particles: GardenParticle[],
  x: number,
  y: number,
  colorId: GardenColorId,
  chain: number,
  cap: number
): GardenParticle[] {
  const accent = colorDef(colorId).accent;
  const gold = "#FFE048";
  let out = spawnParticles(particles, x, y, gold, Math.min(18, 4 + chain * 2), cap);
  if (chain >= 3) {
    out = spawnParticles(out, x, y, accent, Math.min(10, chain), cap);
  }
  return out;
}

export function tickParticles(particles: GardenParticle[], dt: number): GardenParticle[] {
  const decay = dt / 620;
  return particles
    .map((p) => ({
      ...p,
      x: p.x + p.vx * (dt / 16),
      y: p.y + p.vy * (dt / 16),
      vy: p.vy + 0.008 * (dt / 16),
      life: p.life - decay,
    }))
    .filter((p) => p.life > 0);
}

export function spawnAmbientMote(motes: GardenMote[], w: number, h: number, cap: number): GardenMote[] {
  if (motes.length >= cap || Math.random() > 0.55) return motes;
  const out = [...motes];
  out.push({
    x: 40 + Math.random() * (w - 80),
    y: h * 0.25 + Math.random() * h * 0.55,
    vx: (Math.random() - 0.5) * 0.08,
    vy: -0.04 - Math.random() * 0.06,
    life: 1,
    maxLife: 1,
    size: 1 + Math.random() * 2,
  });
  return out.slice(-cap);
}

export function tickMotes(motes: GardenMote[], dt: number, h: number): GardenMote[] {
  const decay = dt / 4200;
  return motes
    .map((m) => ({
      ...m,
      x: m.x + m.vx * dt,
      y: m.y + m.vy * dt,
      life: m.life - decay,
    }))
    .filter((m) => m.life > 0 && m.y > 40 && m.y < h - 20);
}

export function squashScale(juicePop: number, juiceSquash: number, resonance = 0): { sx: number; sy: number } {
  const pop = juicePop * 0.14 + resonance * 0.06;
  const sq = juiceSquash * 0.09;
  return { sx: 1 + pop - sq, sy: 1 - pop * 0.45 + sq };
}
