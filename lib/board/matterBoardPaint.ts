import type { Body } from "matter-js";
import type Matter from "matter-js";
import { getBlockMaterial, getVibeKind } from "../physics/collisions";
import type { BlockMaterial } from "../physics/collisions";
import type { Particle } from "../effects/particles";
import { stepParticles } from "../effects/particles";

export type { Particle };

export interface BoardFxSnapshot {
  projectileTextureUrl: string | null;
  /** When true, bitmap projectile is clipped to a circle (face + GVC token skins). */
  projectileCircularMask: boolean;
  /** Library face texture for “bad vibe” targets (e.g. purple mischievous). */
  badVibeTextureUrl: string | null;
  proceduralOrb: "gold" | "badge" | null;
  aimPullNorm: number;
  dragging: boolean;
  reducedMotion: boolean;
  particles: Particle[];
  shake: number;
  flashes: { x: number; y: number; life: number }[];
  trail: { x: number; y: number }[];
  starBurst: number;
  /** Matter body outlines + labels (`?debug=1`). */
  debugDraw: boolean;
  /** Dark arena fill + vignette on the Matter canvas (gameplay focus). */
  gameplayArena: boolean;
}

const GOLD = "#FFE048";

const imgReady = new Map<string, HTMLImageElement | "err">();

/** IPFS and many gateways omit ACAO; `crossOrigin="anonymous"` then fails to load. */
function crossOriginModeForCanvas(url: string): "anonymous" | undefined {
  const u = url.trim();
  if (!u.startsWith("http")) return "anonymous";
  try {
    const { hostname } = new URL(u);
    if (hostname.endsWith("public.blob.vercel-storage.com")) return "anonymous";
    if (typeof window !== "undefined" && hostname === window.location.hostname) return "anonymous";
  } catch {
    return undefined;
  }
  return undefined;
}

function ensureImage(url: string): HTMLImageElement | null {
  if (!url) return null;
  const hit = imgReady.get(url);
  if (hit === "err") return null;
  if (hit?.complete && hit.naturalWidth > 0) return hit;
  if (hit) return null;
  const img = new Image();
  const co = crossOriginModeForCanvas(url);
  if (co) img.crossOrigin = co;
  img.onload = () => imgReady.set(url, img);
  img.onerror = () => imgReady.set(url, "err");
  img.src = url;
  imgReady.set(url, img);
  return null;
}

export function preloadProjectileUrl(url: string | null): void {
  if (url) void ensureImage(url);
}

function drawBlock(ctx: CanvasRenderingContext2D, b: Body, mat: BlockMaterial) {
  const parts = b.parts?.length ? b.parts : [b];
  const p0 = parts[0];
  const verts = p0.vertices;
  if (!verts?.length) return;
  ctx.beginPath();
  ctx.moveTo(verts[0].x, verts[0].y);
  for (let i = 1; i < verts.length; i++) ctx.lineTo(verts[i].x, verts[i].y);
  ctx.closePath();

  const cx = b.position.x;
  const cy = b.position.y;
  const ang = b.angle;

  if (mat === "glass") {
    const g = ctx.createLinearGradient(cx - 40, cy - 20, cx + 40, cy + 20);
    g.addColorStop(0, "rgba(18,18,18,0.92)");
    g.addColorStop(0.5, "rgba(40,40,44,0.55)");
    g.addColorStop(1, "rgba(18,18,18,0.88)");
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,224,72,0.35)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else if (mat === "crate") {
    ctx.fillStyle = "#151515";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ang);
    ctx.strokeStyle = "rgba(255,224,72,0.22)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-6, -4);
    ctx.lineTo(6, 4);
    ctx.stroke();
    ctx.restore();
  } else if (mat === "stone") {
    ctx.fillStyle = "#1a1a1a";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = "rgba(255,224,72,0.15)";
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (mat === "metal") {
    ctx.fillStyle = "#222226";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,224,72,0.12)";
    ctx.lineWidth = 2.5;
    ctx.setLineDash([2, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (mat === "bounce") {
    const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, 30);
    g.addColorStop(0, "rgba(255,107,157,0.35)");
    g.addColorStop(1, "rgba(255,95,31,0.12)");
    ctx.fillStyle = "#121212";
    ctx.fill();
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,107,157,0.55)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else if (mat === "fragile") {
    ctx.fillStyle = "rgba(26,26,30,0.95)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,224,72,0.5)";
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,107,157,0.25)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (mat === "vibe_core") {
    const g = ctx.createRadialGradient(cx - 6, cy - 6, 2, cx, cy, 42);
    g.addColorStop(0, "rgba(255,107,157,0.55)");
    g.addColorStop(0.45, "rgba(255,95,31,0.28)");
    g.addColorStop(1, "rgba(18,18,22,0.95)");
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,224,72,0.55)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = "rgba(46,255,46,0.2)";
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  } else {
    ctx.fillStyle = "rgba(12,12,12,0.95)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,224,72,0.45)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
}

function clipBodyOutline(ctx: CanvasRenderingContext2D, b: Body) {
  const parts = b.parts?.length ? b.parts : [b];
  const verts = parts[0]?.vertices;
  if (!verts?.length) return;
  ctx.beginPath();
  ctx.moveTo(verts[0].x, verts[0].y);
  for (let i = 1; i < verts.length; i++) ctx.lineTo(verts[i].x, verts[i].y);
  ctx.closePath();
}

function obbHalfExtents(b: Body): { hw: number; hh: number } {
  const ang = -b.angle;
  const ca = Math.cos(ang);
  const sa = Math.sin(ang);
  let hw = 0;
  let hh = 0;
  for (const v of b.vertices) {
    const dx = v.x - b.position.x;
    const dy = v.y - b.position.y;
    const rx = dx * ca - dy * sa;
    const ry = dx * sa + dy * ca;
    hw = Math.max(hw, Math.abs(rx));
    hh = Math.max(hh, Math.abs(ry));
  }
  return { hw: hw || 14, hh: hh || 14 };
}

function drawTarget(ctx: CanvasRenderingContext2D, b: Body, rm: boolean, badVibeUrl: string | null) {
  const { x, y } = b.position;
  const ang = b.angle;
  const isCircle = typeof b.circleRadius === "number" && b.circleRadius > 0;
  const r = isCircle ? (b.circleRadius as number) : Math.hypot(obbHalfExtents(b).hw, obbHalfExtents(b).hh);

  const faceImg = badVibeUrl ? ensureImage(badVibeUrl) : null;
  const faceReady = !!(faceImg && faceImg.complete && faceImg.naturalWidth > 0);

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);

  if (faceReady && faceImg) {
    ctx.beginPath();
    if (isCircle) {
      ctx.arc(0, 0, r * 0.98, 0, Math.PI * 2);
    } else {
      const { hw, hh } = obbHalfExtents(b);
      const k = 0.94;
      ctx.rect(-hw * k, -hh * k, hw * 2 * k, hh * 2 * k);
    }
    ctx.clip();
    const span = isCircle ? r * 2.1 : Math.max(obbHalfExtents(b).hw, obbHalfExtents(b).hh) * 2.1;
    const s = span / Math.max(faceImg.width, faceImg.height);
    ctx.drawImage(
      faceImg,
      (-faceImg.width * s) / 2,
      (-faceImg.height * s) / 2,
      faceImg.width * s,
      faceImg.height * s
    );
    ctx.restore();

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.beginPath();
    if (isCircle) {
      ctx.arc(0, 0, r, 0, Math.PI * 2);
    } else {
      const { hw, hh } = obbHalfExtents(b);
      const rr = 6;
      ctx.moveTo(-hw + rr, -hh);
      ctx.lineTo(hw - rr, -hh);
      ctx.quadraticCurveTo(hw, -hh, hw, -hh + rr);
      ctx.lineTo(hw, hh - rr);
      ctx.quadraticCurveTo(hw, hh, hw - rr, hh);
      ctx.lineTo(-hw + rr, hh);
      ctx.quadraticCurveTo(-hw, hh, -hw, hh - rr);
      ctx.lineTo(-hw, -hh + rr);
      ctx.quadraticCurveTo(-hw, -hh, -hw + rr, -hh);
      ctx.closePath();
    }
    ctx.strokeStyle = "rgba(255,224,72,0.45)";
    ctx.lineWidth = 2;
    ctx.setLineDash(rm ? [] : [5, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    if (isCircle) {
      ctx.arc(0, 0, r * 0.72, 0.2, 1.8);
    } else {
      const { hw, hh } = obbHalfExtents(b);
      ctx.moveTo(-hw * 0.5, -hh * 0.2);
      ctx.lineTo(hw * 0.45, hh * 0.35);
    }
    ctx.strokeStyle = "rgba(255,107,157,0.2)";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
    return;
  }

  ctx.beginPath();
  if (isCircle) {
    const grd = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 1.1);
    grd.addColorStop(0, "#2a2a2a");
    grd.addColorStop(0.55, "#121212");
    grd.addColorStop(1, "#080808");
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();
  } else {
    const { hw, hh } = obbHalfExtents(b);
    ctx.fillStyle = "#151515";
    const k = 6;
    ctx.moveTo(-hw + k, -hh);
    ctx.lineTo(hw - k, -hh);
    ctx.quadraticCurveTo(hw, -hh, hw, -hh + k);
    ctx.lineTo(hw, hh - k);
    ctx.quadraticCurveTo(hw, hh, hw - k, hh);
    ctx.lineTo(-hw + k, hh);
    ctx.quadraticCurveTo(-hw, hh, -hw, hh - k);
    ctx.lineTo(-hw, -hh + k);
    ctx.quadraticCurveTo(-hw, -hh, -hw + k, -hh);
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = "rgba(255,224,72,0.35)";
  ctx.lineWidth = 2;
  ctx.setLineDash(rm ? [] : [5, 4]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawPlatform(ctx: CanvasRenderingContext2D, b: Body) {
  clipBodyOutline(ctx, b);
  ctx.fillStyle = "rgba(10,10,12,0.92)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,224,72,0.2)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawGoldOrb(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, pulse: number) {
  const pr = radius * (1 + pulse * 0.08);
  const g = ctx.createRadialGradient(x - pr * 0.35, y - pr * 0.35, pr * 0.1, x, y, pr * 1.2);
  g.addColorStop(0, "#fff8c8");
  g.addColorStop(0.35, GOLD);
  g.addColorStop(0.85, "#c9a820");
  g.addColorStop(1, "#5a4a10");
  ctx.beginPath();
  ctx.arc(x, y, pr, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawBadgeOrb(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, pulse: number) {
  const pr = radius * (1 + pulse * 0.06);
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    const px = Math.cos(a) * pr;
    const py = Math.sin(a) * pr;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  const g = ctx.createRadialGradient(0, 0, 2, 0, 0, pr);
  g.addColorStop(0, "#fff8d0");
  g.addColorStop(0.5, GOLD);
  g.addColorStop(1, "#6a5218");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,107,157,0.45)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawProjectile(
  ctx: CanvasRenderingContext2D,
  b: Body,
  fx: BoardFxSnapshot,
  tMs: number
) {
  const { x, y } = b.position;
  const ang = b.angle;
  const r = b.circleRadius ?? 16;
  const idlePulse = b.isStatic && !fx.reducedMotion ? Math.sin(tMs * 0.0035) * 0.045 : 0;
  const pulse = fx.dragging ? 0.12 + fx.aimPullNorm * 0.18 : idlePulse;
  const scale = fx.dragging ? 1 + fx.aimPullNorm * 0.12 : 1 + idlePulse * 0.35;
  const rr = r * scale;

  ctx.save();
  ctx.shadowColor = "rgba(255,224,72,0.55)";
  ctx.shadowBlur = fx.dragging ? 18 + fx.aimPullNorm * 22 : 14;

  if (fx.proceduralOrb === "gold") {
    drawGoldOrb(ctx, x, y, rr, pulse);
  } else if (fx.proceduralOrb === "badge") {
    drawBadgeOrb(ctx, x, y, rr, pulse);
  } else {
    const url = fx.projectileTextureUrl ?? "/shaka.png";
    const img = ensureImage(url);
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.translate(x, y);
      ctx.rotate(ang);
      if (fx.projectileCircularMask) {
        ctx.beginPath();
        ctx.arc(0, 0, rr * 1.02, 0, Math.PI * 2);
        ctx.clip();
      }
      const s = (rr * 2.1) / Math.max(img.width, img.height);
      ctx.drawImage(img, (-img.width * s) / 2, (-img.height * s) / 2, img.width * s, img.height * s);
    } else {
      drawGoldOrb(ctx, x, y, rr * 0.95, pulse);
    }
  }
  ctx.restore();
}

function drawTrail(ctx: CanvasRenderingContext2D, trail: { x: number; y: number }[], rm: boolean) {
  if (rm || trail.length < 2) return;
  for (let i = 0; i < trail.length - 1; i++) {
    const t = i / (trail.length - 1);
    const a = 0.08 + t * 0.35;
    ctx.beginPath();
    ctx.arc(trail[i].x, trail[i].y, 2 + t * 3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,224,72,${a})`;
    ctx.fill();
  }
}

function drawParticles(ctx: CanvasRenderingContext2D, parts: Particle[]) {
  stepParticles(parts);
  for (const p of parts) {
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function updateFlashes(flashes: { x: number; y: number; life: number }[]) {
  for (let i = flashes.length - 1; i >= 0; i--) {
    flashes[i].life -= 0.1;
    if (flashes[i].life <= 0) flashes.splice(i, 1);
  }
}

function drawFlashes(ctx: CanvasRenderingContext2D, flashes: { x: number; y: number; life: number }[]) {
  for (const f of flashes) {
    const grd = ctx.createRadialGradient(f.x, f.y, 2, f.x, f.y, 40 * f.life);
    grd.addColorStop(0, `rgba(255,224,72,${0.5 * f.life})`);
    grd.addColorStop(0.4, `rgba(255,107,157,${0.25 * f.life})`);
    grd.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(f.x, f.y, 48 * Math.max(0.2, f.life), 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawStarBurst(ctx: CanvasRenderingContext2D, cx: number, cy: number, framesLeft: number) {
  const t = framesLeft / 50;
  const n = 10;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (1 - t) * 3;
    const len = (1 - t) * 80;
    ctx.strokeStyle = `rgba(255,224,72,${0.15 + t * 0.5})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
    ctx.stroke();
  }
}

/** Custom paint on Matter canvas after engine render (bodies use render.visible=false). */
export function attachMatterBoardPaint(
  MatterLib: typeof Matter,
  render: Matter.Render,
  engine: Matter.Engine,
  getFx: () => BoardFxSnapshot,
  slingRest: { x: number; y: number }
): () => void {
  const onAfterRender = () => {
    const ctx = render.canvas.getContext("2d");
    if (!ctx) return;
    const fx = getFx();
    const bodies = MatterLib.Composite.allBodies(engine.world);
    const w = render.options.width ?? 800;
    const h = render.options.height ?? 520;

    fx.shake *= 0.88;
    const sx = (Math.random() - 0.5) * fx.shake * 2;
    const sy = (Math.random() - 0.5) * fx.shake * 2;

    ctx.save();
    ctx.translate(sx, sy);

    if (fx.gameplayArena) {
      /* Tint only — keep alpha so the HTML layer (GVC library art) shows through the canvas. */
      ctx.fillStyle = "rgba(5,5,6,0.48)";
      ctx.fillRect(0, 0, w, h);
      const vg = ctx.createRadialGradient(w * 0.5, h * 0.38, w * 0.08, w * 0.5, h * 0.48, Math.max(w, h) * 0.72);
      vg.addColorStop(0, "rgba(255,224,72,0.06)");
      vg.addColorStop(0.42, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(0,0,0,0.45)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);
    }

    for (const b of bodies) {
      const k = getVibeKind(b);
      if (k === "block") drawBlock(ctx, b, getBlockMaterial(b));
      else if (k === "target") drawTarget(ctx, b, fx.reducedMotion, fx.badVibeTextureUrl);
      else if (k === "platform") drawPlatform(ctx, b);
    }

    if (fx.debugDraw) {
      ctx.save();
      ctx.font = "10px monospace";
      for (const b of bodies) {
        const k = getVibeKind(b);
        if (k === "wall" || !k) continue;
        const { min, max } = b.bounds;
        const plugin = b.plugin as { breakable?: boolean; blockRole?: string } | undefined;
        const isWeak = plugin?.breakable || plugin?.blockRole === "weakPoint";
        ctx.strokeStyle =
          k === "target"
            ? "rgba(255,107,157,0.65)"
            : k === "projectile"
              ? "rgba(46,255,46,0.7)"
              : isWeak
                ? "rgba(255,95,31,0.85)"
                : "rgba(255,224,72,0.35)";
        ctx.lineWidth = isWeak ? 2 : 1;
        ctx.strokeRect(min.x, min.y, max.x - min.x, max.y - min.y);
        ctx.fillStyle = "rgba(255,255,255,0.75)";
        const tag = plugin?.blockRole ? `${b.label} (${plugin.blockRole})` : b.label || k;
        ctx.fillText(tag, b.position.x - 14, b.position.y);
      }
      ctx.restore();
    }

    const proj = bodies.find((b) => getVibeKind(b) === "projectile");
    if (proj && !proj.isStatic && !fx.reducedMotion) {
      fx.trail.push({ x: proj.position.x, y: proj.position.y });
      while (fx.trail.length > 20) fx.trail.shift();
    } else if (proj?.isStatic && fx.trail.length) {
      fx.trail.length = 0;
    }
    drawTrail(ctx, fx.trail, fx.reducedMotion);

    if (proj) drawProjectile(ctx, proj, fx, performance.now());

    updateFlashes(fx.flashes);
    drawFlashes(ctx, fx.flashes);
    drawParticles(ctx, fx.particles);

    if (fx.starBurst > 0 && !fx.reducedMotion) {
      drawStarBurst(ctx, w * 0.5, h * 0.35, fx.starBurst);
      fx.starBurst -= 1;
    }

    const anchorGlow = ctx.createRadialGradient(slingRest.x, slingRest.y, 4, slingRest.x, slingRest.y, 70);
    anchorGlow.addColorStop(0, "rgba(255,224,72,0.22)");
    anchorGlow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = anchorGlow;
    ctx.beginPath();
    ctx.arc(slingRest.x, slingRest.y, 70, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.arc(slingRest.x, slingRest.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.45)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  };

  MatterLib.Events.on(render, "afterRender", onAfterRender);
  return () => {
    MatterLib.Events.off(render, "afterRender", onAfterRender);
  };
}
