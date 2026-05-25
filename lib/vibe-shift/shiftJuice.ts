import { GVC_COLOR_ACCENT } from "@/lib/assets/gvcLibraryFaces";
import type { MatchGroup } from "./shiftMatch";
import type { ShiftColorId } from "./shiftConfig";

export interface ShiftFloatLabel {
  text: string;
  sub?: string;
  x: number;
  y: number;
  life: number;
  maxLife: number;
  pop: number;
  big: boolean;
  color: string;
}

export interface ShiftParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface ShiftPopCell {
  r: number;
  c: number;
  life: number;
  maxLife: number;
  color: string;
  scale: number;
}

export interface ShiftJuiceFx {
  labels: ShiftFloatLabel[];
  particles: ShiftParticle[];
  pops: ShiftPopCell[];
  flashCells: Set<string>;
  comboBanner: string | null;
  comboLife: number;
}

export function emptyShiftJuice(): ShiftJuiceFx {
  return {
    labels: [],
    particles: [],
    pops: [],
    flashCells: new Set(),
    comboBanner: null,
    comboLife: 0,
  };
}

import { SHIFT_BOARD_SIZE } from "./shiftConfig";

export function groupCenter(
  groups: MatchGroup[],
  cs: number,
  rows: number,
  cols: number
): { x: number; y: number } {
  let sx = 0;
  let sy = 0;
  let n = 0;
  for (const g of groups) {
    for (const { r, c } of g.coords) {
      sx += c * cs + cs / 2;
      sy += r * cs + cs / 2;
      n++;
    }
  }
  return n ? { x: sx / n, y: sy / n } : { x: (cols * cs) / 2, y: (rows * cs) / 2 };
}

export function spawnMatchJuice(
  groups: MatchGroup[],
  coords: { r: number; c: number }[],
  scoreDelta: number,
  cs: number,
  cascadeIndex: number,
  rows: number,
  cols: number
): ShiftJuiceFx {
  const fx = emptyShiftJuice();
  const center = groupCenter(groups, cs, rows, cols);
  const top = [...groups].sort((a, b) => {
    const rank = (g: MatchGroup) =>
      g.kind === "line5" ? 5 : g.kind === "line4" ? 4 : g.kind === "square" ? g.size + 1 : 2;
    return rank(b) - rank(a);
  })[0];

  fx.labels.push({
    text: top ? top.label : "MATCH!",
    sub: `+${scoreDelta}`,
    x: center.x,
    y: center.y,
    life: 1,
    maxLife: 1,
    pop: top && (top.kind === "line5" || top.kind === "line4" || top.size >= 3) ? 1.4 : 1.2,
    big: cascadeIndex === 1 && groups.some((g) => g.kind === "line5" || g.size >= 3),
    color: top ? GVC_COLOR_ACCENT[top.color] : "#FFE048",
  });

  if (cascadeIndex > 1) {
    fx.comboBanner = `CHAIN ×${cascadeIndex}`;
    fx.comboLife = 1;
  }

  for (const { r, c } of coords) {
    fx.flashCells.add(`${r},${c}`);
    const color = top ? GVC_COLOR_ACCENT[top.color] : "#FFE048";
    fx.pops.push({ r, c, life: 1, maxLife: 1, color, scale: 1 });
    for (let i = 0; i < 4; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 1.5 + Math.random() * 3;
      fx.particles.push({
        x: c * cs + cs / 2,
        y: r * cs + cs / 2,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 1,
        maxLife: 1,
        color,
        size: 2 + Math.random() * 3,
      });
    }
  }

  return fx;
}

export function tickShiftJuice(fx: ShiftJuiceFx, dt: number): ShiftJuiceFx {
  const labelDecay = dt / 900;
  const popDecay = dt / 420;
  const particleDecay = dt / 520;

  return {
    labels: fx.labels
      .map((l) => ({
        ...l,
        life: l.life - labelDecay,
        y: l.y - dt * (l.big ? 0.05 : 0.04),
        pop: 0.85 + l.life * 0.35,
      }))
      .filter((l) => l.life > 0),
    particles: fx.particles
      .map((p) => ({
        ...p,
        x: p.x + p.vx * (dt / 16),
        y: p.y + p.vy * (dt / 16),
        vy: p.vy + 0.08 * (dt / 16),
        life: p.life - particleDecay,
      }))
      .filter((p) => p.life > 0),
    pops: fx.pops
      .map((p) => ({
        ...p,
        life: p.life - popDecay,
        scale: 1 + (1 - p.life) * 0.35,
      }))
      .filter((p) => p.life > 0),
    flashCells: fx.flashCells,
    comboBanner: fx.comboBanner,
    comboLife: fx.comboLife > 0 ? fx.comboLife - dt / 700 : 0,
  };
}

export function paintShiftJuice(ctx: CanvasRenderingContext2D, fx: ShiftJuiceFx, cs: number) {
  for (const p of fx.particles) {
    ctx.globalAlpha = p.life * 0.85;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  for (const l of fx.labels) {
    const a = Math.min(1, l.life * 1.4);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(l.x, l.y);
    ctx.scale(l.pop, l.pop);
    ctx.textAlign = "center";
    ctx.font = `900 ${l.big ? 22 : 18}px sans-serif`;
    ctx.fillStyle = l.color;
    ctx.strokeStyle = "rgba(0,0,0,0.6)";
    ctx.lineWidth = 4;
    ctx.strokeText(l.text, 0, 0);
    ctx.fillText(l.text, 0, 0);
    if (l.sub) {
      ctx.font = `900 ${l.big ? 26 : 22}px sans-serif`;
      ctx.fillStyle = "#FFE048";
      ctx.strokeText(l.sub, 0, 24);
      ctx.fillText(l.sub, 0, 24);
    }
    ctx.restore();
  }

  if (fx.comboLife > 0 && fx.comboBanner) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, fx.comboLife);
    ctx.textAlign = "center";
    ctx.font = "900 16px sans-serif";
    ctx.fillStyle = "#FF6B9D";
    ctx.strokeStyle = "rgba(0,0,0,0.5)";
    ctx.lineWidth = 3;
    ctx.strokeText(fx.comboBanner, SHIFT_BOARD_SIZE / 2, cs * 0.55);
    ctx.fillText(fx.comboBanner, SHIFT_BOARD_SIZE / 2, cs * 0.55);
    ctx.restore();
  }
}

export function popScaleForCell(fx: ShiftJuiceFx, r: number, c: number): number {
  const pop = fx.pops.find((p) => p.r === r && p.c === c);
  if (!pop) return 1;
  return pop.scale;
}

export function isFlashingCell(fx: ShiftJuiceFx, r: number, c: number): boolean {
  return fx.flashCells.has(`${r},${c}`);
}

export function accentForColor(colorId: ShiftColorId): string {
  return GVC_COLOR_ACCENT[colorId];
}
