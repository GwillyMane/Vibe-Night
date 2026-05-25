import Matter from "matter-js";
import { bowlFloorY, colorDef, GARDEN_WORLD, type GardenColorId } from "./gardenConfig";
import { getGardenFaceImage } from "./gardenFaces";
import { getMergeBackgroundImage } from "@/lib/vibe-merge/mergeBackgrounds";
import { pluginOf } from "./gardenPhysics";
import {
  squashScale,
  type GardenBurst,
  type GardenFloatLabel,
  type GardenMote,
  type GardenParticle,
  type GardenShockwave,
} from "./gardenJuice";

export function previewColorChip(ctx: CanvasRenderingContext2D, colorId: GardenColorId, size: number) {
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

function drawEntity(
  ctx: CanvasRenderingContext2D,
  body: Matter.Body,
  now: number
) {
  const p = pluginOf(body);
  const def = colorDef(p.colorId);
  const breath = 1 + Math.sin(now * 0.0022 + p.idleSeed) * 0.028;
  const corruptWobble = p.state === "corrupted" ? Math.sin(now * 0.012 + p.idleSeed) * 0.04 : 0;
  const { sx, sy } = squashScale(p.juicePop, p.juiceSquash, p.resonance);
  const fade = 1 - p.dissolve * 0.55;
  const x = body.position.x;
  const y = body.position.y;
  const r = def.radius * fade * breath;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(body.angle + corruptWobble);
  ctx.scale(sx * fade, sy * fade);
  ctx.globalAlpha = 0.38 + fade * 0.62;

  if (p.resonance > 0.08) {
    ctx.strokeStyle = `rgba(255, 224, 72, ${p.resonance * 0.55})`;
    ctx.lineWidth = 2 + p.resonance * 3;
    ctx.beginPath();
    ctx.arc(0, 0, r * (1.35 + p.resonance * 0.25), 0, Math.PI * 2);
    ctx.stroke();
  }

  if (p.nearCorrupt > 0.05) {
    ctx.strokeStyle = `rgba(255, 95, 31, ${p.nearCorrupt * 0.45})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, r * (1.12 + p.nearCorrupt * 0.15), 0, Math.PI * 2);
    ctx.stroke();
  }

  if (def.halo === "gold" || p.colorId === 6) {
    const grd = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 1.5);
    grd.addColorStop(0, "rgba(255,224,72,0.55)");
    grd.addColorStop(1, "rgba(255,224,72,0)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  if (p.bloomFlash > 0.05) {
    ctx.fillStyle = `rgba(255, 224, 72, ${p.bloomFlash * 0.45})`;
    ctx.beginPath();
    ctx.arc(0, 0, r * (1.25 + p.bloomFlash * 0.4), 0, Math.PI * 2);
    ctx.fill();
  }

  if (p.state === "blooming") {
    ctx.strokeStyle = `rgba(255, 224, 72, ${0.35 + p.bloomFlash * 0.4})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.08, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (p.state === "corrupted") {
    const pulse = 0.25 + p.corruptPulse * 0.4 + Math.sin(now * 0.01 + p.idleSeed) * 0.08;
    ctx.fillStyle = `rgba(255, 95, 31, ${pulse})`;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(255, 95, 31, ${0.35 + p.corruptPulse * 0.35})`;
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const a = now * 0.004 + p.idleSeed + (i * Math.PI) / 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5);
      ctx.lineTo(Math.cos(a) * r * 1.25, Math.sin(a) * r * 1.25);
      ctx.stroke();
    }
  }

  const img = getGardenFaceImage(p.colorId);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.save();
  ctx.clip();
  if (img?.complete && img.naturalWidth > 0) {
    if (p.state === "corrupted") {
      ctx.filter = "grayscale(0.85) brightness(0.7)";
    }
    ctx.drawImage(img, -r, -r, r * 2, r * 2);
    ctx.filter = "none";
  } else {
    ctx.fillStyle = def.accent;
    ctx.fill();
  }
  ctx.restore();

  ctx.strokeStyle =
    p.state === "corrupted"
      ? `rgba(255, 95, 31, ${0.7 + Math.sin(now * 0.008) * 0.15})`
      : `rgba(255, 224, 72, ${0.35 + p.juicePop * 0.35})`;
  ctx.lineWidth = 2 + p.juicePop;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function drawBackgroundCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  w: number,
  h: number
) {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  if (!iw || !ih) return;
  const scale = Math.max(w / iw, h / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = (w - dw) / 2;
  const dy = (h - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
}

function drawFloatLabel(ctx: CanvasRenderingContext2D, f: GardenFloatLabel) {
  const t = Math.min(1, f.life);
  const scale = f.pop * (0.85 + t * 0.35);
  ctx.save();
  ctx.translate(f.x, f.y);
  ctx.scale(scale, scale);
  ctx.globalAlpha = t * t;
  ctx.font = `bold ${f.big ? 15 : 12}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = f.big ? "#FF6B9D" : "#FFE048";
  ctx.strokeStyle = "rgba(0,0,0,0.75)";
  ctx.lineWidth = 4;
  ctx.strokeText(f.text, 0, 0);
  ctx.fillText(f.text, 0, 0);
  ctx.restore();
}

function drawBursts(ctx: CanvasRenderingContext2D, bursts: GardenBurst[]) {
  for (const b of bursts) {
    const t = b.life;
    const r = b.radius * (0.35 + (1 - t) * 1.35);
    const accent = b.colorId === 6 ? "#FFE048" : colorDef(b.colorId).accent;
    ctx.save();
    ctx.globalAlpha = t * 0.55;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2 + (1 - t) * 5;
    ctx.beginPath();
    ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = t * 0.25;
    ctx.lineWidth = 1 + (1 - t) * 2;
    ctx.beginPath();
    ctx.arc(b.x, b.y, r * 0.65, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawShockwaves(ctx: CanvasRenderingContext2D, waves: GardenShockwave[]) {
  for (const w of waves) {
    const t = 1 - w.life / w.maxLife;
    const r = w.maxRadius * t;
    const alpha = w.life / w.maxLife;
    ctx.save();
    if (w.kind === "full") {
      ctx.strokeStyle = `rgba(255, 224, 72, ${alpha * 0.7})`;
      ctx.lineWidth = 4 + (1 - alpha) * 3;
    } else if (w.kind === "corrupt") {
      ctx.strokeStyle = `rgba(255, 95, 31, ${alpha * 0.55})`;
      ctx.lineWidth = 2 + (1 - alpha) * 2;
    } else if (w.kind === "calm") {
      ctx.strokeStyle = `rgba(46, 255, 46, ${alpha * 0.45})`;
      ctx.lineWidth = 2;
    } else {
      ctx.strokeStyle = `rgba(255, 224, 72, ${alpha * 0.55})`;
      ctx.lineWidth = 2 + (1 - alpha) * 2;
    }
    ctx.beginPath();
    ctx.arc(w.x, w.y, r, 0, Math.PI * 2);
    ctx.stroke();
    if (w.kind === "full" || w.kind === "bloom") {
      ctx.globalAlpha = alpha * 0.2;
      ctx.fillStyle = w.kind === "full" ? "rgba(255,224,72,0.15)" : "rgba(255,224,72,0.08)";
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawMotes(ctx: CanvasRenderingContext2D, motes: GardenMote[]) {
  for (const m of motes) {
    ctx.save();
    ctx.globalAlpha = m.life * 0.35;
    ctx.fillStyle = "#FFE048";
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: GardenParticle[]) {
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = p.life * 0.8;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function paintGardenWorld(
  ctx: CanvasRenderingContext2D,
  engine: Matter.Engine,
  opts: {
    corruption: number;
    stability: number;
    backgroundId: string;
    floats?: GardenFloatLabel[];
    bursts?: GardenBurst[];
    particles?: GardenParticle[];
    shockwaves?: GardenShockwave[];
    motes?: GardenMote[];
    shakeX?: number;
    shakeY?: number;
    bowlPulse?: number;
    calmPulse?: number;
    showHint?: boolean;
  }
) {
  const w = GARDEN_WORLD.width;
  const h = GARDEN_WORLD.height;
  const now = performance.now();
  const shakeX = opts.shakeX ?? 0;
  const shakeY = opts.shakeY ?? 0;
  const bowlPulse = opts.bowlPulse ?? 0;
  const calmPulse = opts.calmPulse ?? 0;

  ctx.save();
  ctx.translate(shakeX, shakeY);

  const bg = getMergeBackgroundImage(opts.backgroundId);
  if (bg?.complete && bg.naturalWidth > 0) {
    drawBackgroundCover(ctx, bg, w, h);
    ctx.fillStyle = "rgba(5, 5, 5, 0.55)";
    ctx.fillRect(0, 0, w, h);
  } else {
    const gradient = ctx.createRadialGradient(w / 2, h * 0.55, 40, w / 2, h * 0.55, w * 0.65);
    gradient.addColorStop(0, "#0a120a");
    gradient.addColorStop(0.6, "#050505");
    gradient.addColorStop(1, "#030303");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  }

  // Bowl outline — pulses with blooms & stability
  const floorY = bowlFloorY();
  const bowlAlpha = 0.18 + bowlPulse * 0.35 + calmPulse * 0.15;
  const bowlWidth = 2 + bowlPulse * 2.5;
  ctx.strokeStyle = `rgba(255, 224, 72, ${bowlAlpha})`;
  ctx.lineWidth = bowlWidth;
  ctx.beginPath();
  ctx.moveTo(36, floorY);
  ctx.quadraticCurveTo(w / 2, floorY + 28 + bowlPulse * 6, w - 36, floorY);
  ctx.stroke();

  if (bowlPulse > 0.05) {
    ctx.strokeStyle = `rgba(255, 224, 72, ${bowlPulse * 0.2})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(w / 2, h * 0.52, w * 0.36 * (1 + bowlPulse * 0.08), 0, Math.PI * 2);
    ctx.stroke();
  }

  // Corruption vignette — breathes with infection level
  const corruptT = opts.corruption / 100;
  const corruptBreath = Math.sin(now * 0.0018) * 0.04;
  if (corruptT > 0.03) {
    const vg = ctx.createRadialGradient(w / 2, h / 2, w * 0.15, w / 2, h / 2, w * 0.78);
    vg.addColorStop(0, "rgba(255,95,31,0)");
    vg.addColorStop(1, `rgba(255,95,31,${(corruptT + corruptBreath) * 0.38})`);
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
  }

  // Ecosystem calm after full bloom
  if (calmPulse > 0.02) {
    const cg = ctx.createRadialGradient(w / 2, h * 0.5, 20, w / 2, h * 0.5, w * 0.55);
    cg.addColorStop(0, `rgba(46,255,46,${calmPulse * 0.08})`);
    cg.addColorStop(1, "rgba(46,255,46,0)");
    ctx.fillStyle = cg;
    ctx.fillRect(0, 0, w, h);
  }

  // Stability undertone
  const stabT = opts.stability / 100;
  if (stabT < 0.55) {
    ctx.fillStyle = `rgba(255, 95, 31, ${(0.55 - stabT) * 0.12})`;
    ctx.fillRect(0, 0, w, h);
  }

  drawMotes(ctx, opts.motes ?? []);
  const bodies = Matter.Composite.allBodies(engine.world).filter((b) => !b.isStatic);
  for (const b of bodies) drawEntity(ctx, b, now);

  drawShockwaves(ctx, opts.shockwaves ?? []);
  drawBursts(ctx, opts.bursts ?? []);
  drawParticles(ctx, opts.particles ?? []);
  for (const f of opts.floats ?? []) drawFloatLabel(ctx, f);

  if (opts.showHint) {
    ctx.font = "600 11px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,224,72,0.55)";
    ctx.fillText("Tap the garden to plant · blooms spread to nearby vibes", w / 2, h - 18);
  }

  ctx.restore();
}

export function drawPreviewChip(
  ctx: CanvasRenderingContext2D,
  colorId: GardenColorId,
  size: number
) {
  const def = colorDef(colorId);
  const r = size / 2 - 2;
  const img = getGardenFaceImage(colorId);
  ctx.save();
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  if (img?.complete && img.naturalWidth) {
    ctx.drawImage(img, 2, 2, size - 4, size - 4);
  } else {
    ctx.fillStyle = def.accent;
    ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = "rgba(255,224,72,0.45)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, r, 0, Math.PI * 2);
  ctx.stroke();
}
