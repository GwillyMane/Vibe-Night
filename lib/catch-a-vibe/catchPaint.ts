import { CATCH_WORLD, colorDef, type CatchColorId } from "./catchConfig";
import { getBadVibeFaceImage, getCatchFaceImage } from "./catchFaces";
import { getMergeBackgroundImage } from "@/lib/vibe-merge/mergeBackgrounds";
import type { CatchVibe } from "./catchEntities";
import {
  squashScale,
  type CatchBurst,
  type CatchFloatLabel,
  type CatchMote,
  type CatchParticle,
  type CatchShockwave,
} from "./catchJuice";
import { smoothTrailPoints, type SwipeTrail } from "./catchSwipe";

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function drawVibe(ctx: CanvasRenderingContext2D, vibe: CatchVibe, now: number) {
  const isBad = vibe.kind === "bad";
  const def = isBad ? { accent: "#B06BFF", radius: vibe.radius, halo: "none" as const } : colorDef(vibe.colorId);
  const breath = 1 + Math.sin(now * 0.0025 + vibe.idleSeed) * 0.03;
  const { sx, sy } = squashScale(vibe.juicePop, vibe.absorb);
  const fade = vibe.state === "absorbing" ? 1 - vibe.absorb * 0.3 : 1;
  const r = (isBad ? vibe.radius : def.radius) * breath * fade;
  const x = vibe.x;
  const y = vibe.y;

  const glowColor = isBad ? "#B06BFF" : def.accent;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(vibe.rotation);
  ctx.scale(sx * fade, sy * fade);
  ctx.globalAlpha = 0.4 + fade * 0.6;

  if (vibe.nearSwipe > 0.05) {
    ctx.strokeStyle = hexToRgba(glowColor, vibe.nearSwipe * 0.55);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r * (1.15 + vibe.nearSwipe * 0.1), 0, Math.PI * 2);
    ctx.stroke();
  }

  if (def.halo === "gold" || vibe.kind === "golden") {
    const grd = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 1.55);
    grd.addColorStop(0, hexToRgba("#FFE048", 0.6));
    grd.addColorStop(1, hexToRgba("#FFE048", 0));
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.55, 0, Math.PI * 2);
    ctx.fill();
  }

  if (vibe.bloomFlash > 0.05 && !isBad) {
    const flashAlpha = vibe.bloomFlash * (0.45 + vibe.juicePop * 0.35);
    const grd = ctx.createRadialGradient(0, 0, r * 0.15, 0, 0, r * (1.35 + vibe.bloomFlash * 0.4));
    grd.addColorStop(0, hexToRgba(glowColor, flashAlpha));
    grd.addColorStop(1, hexToRgba(glowColor, 0));
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(0, 0, r * (1.35 + vibe.bloomFlash * 0.4), 0, Math.PI * 2);
    ctx.fill();
  }

  if (vibe.juicePop > 0.08 && !isBad && vibe.state === "absorbing") {
    const popAlpha = vibe.juicePop * 0.55 * (1 - vibe.absorb * 0.4);
    const grd = ctx.createRadialGradient(0, 0, r * 0.3, 0, 0, r * (1.5 + vibe.juicePop * 0.25));
    grd.addColorStop(0, hexToRgba(glowColor, popAlpha));
    grd.addColorStop(1, hexToRgba(glowColor, 0));
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(0, 0, r * (1.5 + vibe.juicePop * 0.25), 0, Math.PI * 2);
    ctx.fill();
  }

  if (isBad) {
    const pulse = 0.35 + vibe.badPulse * 0.4 + Math.sin(now * 0.011 + vibe.idleSeed) * 0.1;
    ctx.fillStyle = `rgba(176, 107, 255, ${pulse})`;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(255, 95, 31, ${0.45 + vibe.badPulse * 0.35})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.12, 0, Math.PI * 2);
    ctx.stroke();
  }

  const img = isBad ? getBadVibeFaceImage() : getCatchFaceImage(vibe.colorId);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.clip();
  if (img?.complete && img.naturalWidth) {
    ctx.drawImage(img, -r, -r, r * 2, r * 2);
  } else {
    ctx.fillStyle = def.accent;
    ctx.fill();
  }
  ctx.restore();

  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle =
    isBad
      ? `rgba(176, 107, 255, ${0.55 + vibe.badPulse * 0.25})`
      : hexToRgba(glowColor, 0.4 + vibe.juicePop * 0.45);
  ctx.lineWidth = isBad ? 2.5 : 2;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawSwipeTrail(ctx: CanvasRenderingContext2D, trail: SwipeTrail, now: number) {
  if (trail.points.length < 2) return;
  const pts = smoothTrailPoints(trail.points);
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (let i = 1; i < pts.length; i++) {
    const t = i / (pts.length - 1);
    const prev = pts[i - 1];
    const curr = pts[i];
    const w = 3 + t * 10;
    const alpha = 0.15 + t * 0.65;
    ctx.strokeStyle = `rgba(255, 224, 72, ${alpha})`;
    ctx.lineWidth = w;
    ctx.shadowColor = "rgba(255, 224, 72, 0.8)";
    const blurMax =
      typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches ? 12 : 20;
    ctx.shadowBlur = Math.min(blurMax, 8 + t * 12);
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(curr.x, curr.y);
    ctx.stroke();
  }
  if (trail.active && pts.length > 0) {
    const head = pts[pts.length - 1];
    const pulse = 0.6 + Math.sin(now * 0.015) * 0.2;
    const grd = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 18);
    grd.addColorStop(0, `rgba(255, 224, 72, ${pulse})`);
    grd.addColorStop(1, "rgba(255, 224, 72, 0)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(head.x, head.y, 18, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawShockwaves(ctx: CanvasRenderingContext2D, waves: CatchShockwave[]) {
  for (const w of waves) {
    const t = 1 - w.life / w.maxLife;
    const r = w.maxRadius * t;
    const alpha = (1 - t) * 0.55;
    const def = colorDef(w.colorId);
    ctx.strokeStyle =
      w.kind === "corrupt"
        ? `rgba(176, 107, 255, ${alpha})`
        : w.kind === "full" || w.kind === "calm"
          ? hexToRgba(colorDef(w.colorId).accent, alpha)
          : `${def.accent}${Math.floor(alpha * 255).toString(16).padStart(2, "0")}`;
    ctx.lineWidth = 2 + (1 - t) * 3;
    ctx.beginPath();
    ctx.arc(w.x, w.y, r, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: CatchParticle[]) {
  for (const p of particles) {
    ctx.globalAlpha = p.life * 0.85;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawFloatLabels(ctx: CanvasRenderingContext2D, labels: CatchFloatLabel[]) {
  for (const f of labels) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, f.life * 1.2);
    ctx.font = `${f.big ? "bold 15px" : "bold 12px"} var(--font-brice, sans-serif)`;
    ctx.textAlign = "center";
    ctx.fillStyle = f.big ? "#FFE048" : f.text.includes("BAD") ? "#FF6B9D" : "#ffffff";
    ctx.shadowColor = "rgba(255,224,72,0.6)";
    ctx.shadowBlur = 8;
    ctx.scale(f.pop, f.pop);
    ctx.fillText(f.text, f.x / f.pop, f.y / f.pop);
    ctx.restore();
  }
}

function drawBursts(ctx: CanvasRenderingContext2D, bursts: CatchBurst[]) {
  for (const b of bursts) {
    const t = 1 - b.life / b.maxLife;
    const def = colorDef(b.colorId);
    ctx.globalAlpha = (1 - t) * 0.5;
    ctx.fillStyle = def.accent;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius * (0.5 + t), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawMotes(ctx: CanvasRenderingContext2D, motes: CatchMote[]) {
  for (const m of motes) {
    ctx.globalAlpha = m.life * 0.4;
    ctx.fillStyle = "#FFE048";
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function paintCatchWorld(
  ctx: CanvasRenderingContext2D,
  opts: {
    entities: CatchVibe[];
    trail: SwipeTrail;
    backgroundId: string;
    badStrikes: number;
    calmPulse: number;
    shake: number;
    now: number;
    floats: CatchFloatLabel[];
    bursts: CatchBurst[];
    particles: CatchParticle[];
    shockwaves: CatchShockwave[];
    motes: CatchMote[];
  }
) {
  const { width: w, height: h } = CATCH_WORLD;
  ctx.save();
  if (opts.shake > 0) {
    ctx.translate((Math.random() - 0.5) * opts.shake, (Math.random() - 0.5) * opts.shake);
  }

  ctx.fillStyle = "#050505";
  ctx.fillRect(0, 0, w, h);

  const bg = getMergeBackgroundImage(opts.backgroundId);
  if (bg?.complete && bg.naturalWidth) {
    ctx.globalAlpha = 0.55;
    ctx.drawImage(bg, 0, 0, w, h);
    ctx.globalAlpha = 1;
  }

  const vig = ctx.createRadialGradient(w / 2, h * 0.45, h * 0.1, w / 2, h * 0.45, h * 0.75);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,0,0.35)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  if (opts.badStrikes >= 2) {
    ctx.fillStyle = `rgba(176, 107, 255, ${0.06 + opts.badStrikes * 0.04})`;
    ctx.fillRect(0, 0, w, h);
  }

  if (opts.calmPulse > 0) {
    ctx.fillStyle = `rgba(255, 224, 72, ${opts.calmPulse * 0.08})`;
    ctx.fillRect(0, 0, w, h);
  }

  drawMotes(ctx, opts.motes);
  drawShockwaves(ctx, opts.shockwaves);
  drawBursts(ctx, opts.bursts);

  const sorted = [...opts.entities].sort((a, b) => a.y - b.y);
  for (const v of sorted) drawVibe(ctx, v, opts.now);

  drawParticles(ctx, opts.particles);
  drawSwipeTrail(ctx, opts.trail, opts.now);
  drawFloatLabels(ctx, opts.floats);

  ctx.strokeStyle = "rgba(255, 224, 72, 0.12)";
  ctx.lineWidth = 1;
  ctx.strokeRect(8, CATCH_WORLD.playTop - 8, w - 16, CATCH_WORLD.playBottom - CATCH_WORLD.playTop + 16);

  ctx.restore();
}

export function previewColorChip(ctx: CanvasRenderingContext2D, colorId: CatchColorId, size: number) {
  const def = colorDef(colorId);
  ctx.save();
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
  ctx.fillStyle = def.accent;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,224,72,0.5)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}
