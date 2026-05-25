import type { CatchColorId } from "./catchConfig";
import { colorDef } from "./catchConfig";

export interface CatchFloatLabel {
  text: string;
  x: number;
  y: number;
  life: number;
  maxLife: number;
  pop: number;
  combo: number;
  big?: boolean;
}

export interface CatchBurst {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  colorId: CatchColorId;
  radius: number;
}

export interface CatchParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export type ShockwaveKind = "catch" | "bloom" | "full" | "corrupt" | "calm";

export interface CatchShockwave {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  maxRadius: number;
  kind: ShockwaveKind;
  colorId: CatchColorId;
}

export interface CatchMote {
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
): CatchFloatLabel {
  return { text, x, y: y - 8, life: 1, maxLife: 1, pop: big ? 1.35 : 1.15, combo, big };
}

export function tickFloatLabels(labels: CatchFloatLabel[], dt: number): CatchFloatLabel[] {
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

export function createBurst(x: number, y: number, colorId: CatchColorId, radius: number): CatchBurst {
  return { x, y, life: 1, maxLife: 1, colorId, radius };
}

export function tickBursts(bursts: CatchBurst[], dt: number): CatchBurst[] {
  const decay = dt / 480;
  return bursts.map((b) => ({ ...b, life: b.life - decay })).filter((b) => b.life > 0);
}

export function createShockwave(
  x: number,
  y: number,
  maxRadius: number,
  kind: ShockwaveKind,
  colorId: CatchColorId = 1
): CatchShockwave {
  const maxLife = kind === "full" ? 1.35 : kind === "corrupt" ? 0.95 : 0.75;
  return { x, y, life: maxLife, maxLife, maxRadius, kind, colorId };
}

export function tickShockwaves(waves: CatchShockwave[], dt: number): CatchShockwave[] {
  const decay = dt / 680;
  return waves.map((w) => ({ ...w, life: w.life - decay })).filter((w) => w.life > 0);
}

export function spawnParticles(
  particles: CatchParticle[],
  x: number,
  y: number,
  color: string,
  count: number,
  cap: number,
  inward = false
): CatchParticle[] {
  const out = [...particles];
  for (let i = 0; i < count && out.length < cap; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = inward ? 1.2 + Math.random() * 2.2 : 0.6 + Math.random() * 2.8;
    const dir = inward ? -1 : 1;
    out.push({
      x,
      y,
      vx: Math.cos(a) * sp * dir,
      vy: Math.sin(a) * sp * dir,
      life: 1,
      maxLife: 1,
      color,
      size: 1.5 + Math.random() * 3.5,
    });
  }
  return out.slice(-cap);
}

export function spawnCatchParticles(
  particles: CatchParticle[],
  x: number,
  y: number,
  colorId: CatchColorId,
  combo: number,
  cap: number
): CatchParticle[] {
  const accent = colorDef(colorId).accent;
  const count = Math.min(18, 5 + combo * 2);
  let out = spawnParticles(particles, x, y, accent, count, cap, true);
  if (colorId === 6) {
    out = spawnParticles(out, x, y, "#FFE048", Math.min(8, combo + 2), cap);
  } else if (combo >= 3) {
    out = spawnParticles(out, x, y, accent, Math.min(6, combo), cap);
  }
  return out;
}

export function tickParticles(particles: CatchParticle[], dt: number): CatchParticle[] {
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

export function spawnAmbientMote(motes: CatchMote[], w: number, h: number, cap: number): CatchMote[] {
  if (motes.length >= cap || Math.random() > 0.55) return motes;
  const out = [...motes];
  out.push({
    x: 40 + Math.random() * (w - 80),
    y: h * 0.35 + Math.random() * h * 0.45,
    vx: (Math.random() - 0.5) * 0.08,
    vy: -0.04 - Math.random() * 0.06,
    life: 1,
    maxLife: 1,
    size: 1 + Math.random() * 2,
  });
  return out.slice(-cap);
}

export function tickMotes(motes: CatchMote[], dt: number, h: number): CatchMote[] {
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

export function squashScale(juicePop: number, absorb: number): { sx: number; sy: number } {
  const pop = juicePop * 0.14;
  const shrink = absorb * 0.55;
  return { sx: 1 + pop - shrink * 0.3, sy: 1 + pop * 0.5 - shrink };
}
