import Matter from "matter-js";
import { BIN_TOP, DANGER_Y, dropLineY, MERGE_WORLD, tierDef } from "./mergeConfig";
import type { MergeTierId } from "./mergeConfig";
import { getMergeBackgroundImage } from "./mergeBackgrounds";
import { getTierFaceImage } from "./mergeFaces";
import type { MergePiecePlugin } from "./mergePhysics";
import { pluginJuice, squashScale, type MergeBurst, type MergeFloatLabel } from "./mergeJuice";

export type { MergeFloatLabel, MergeBurst };

/** Draw a tier disc with squash/stretch juice (physics circles match base radius). */
export function drawMergeDisc(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tier: MergeTierId,
  radius: number,
  angle = 0,
  juice?: MergePiecePlugin,
  vy = 0
) {
  const def = tierDef(tier);
  const { sx, sy } = juice ? squashScale(juice, vy) : { sx: 1, sy: 1 };
  const r = radius;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(sx, sy);

  if (def.halo === "gold" || def.halo === "cosmic") {
    const grd = ctx.createRadialGradient(0, 0, r * 0.3, 0, 0, r * 1.35);
    grd.addColorStop(0, def.halo === "cosmic" ? "rgba(255,107,157,0.5)" : "rgba(255,224,72,0.55)");
    grd.addColorStop(1, "rgba(255,224,72,0)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.35, 0, Math.PI * 2);
    ctx.fill();
  }

  const flash = juice?.mergeFlash ?? 0;
  if (flash > 0.05) {
    ctx.fillStyle = `rgba(255, 224, 72, ${flash * 0.45})`;
    ctx.beginPath();
    ctx.arc(0, 0, r * (1.15 + flash * 0.25), 0, Math.PI * 2);
    ctx.fill();
  }

  const img = getTierFaceImage(tier);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.save();
  ctx.clip();
  if (img?.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, -r, -r, r * 2, r * 2);
  } else {
    ctx.fillStyle = tier <= 2 ? "#FF5F1F" : tier <= 4 ? "#2EFF2E" : "#FF6B9D";
    ctx.fill();
  }
  ctx.restore();

  ctx.strokeStyle = `rgba(255, 224, 72, ${0.35 + (juice?.juicePop ?? 0) * 0.35})`;
  ctx.lineWidth = 2 + (juice?.juicePop ?? 0) * 1.5;
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

function drawFloatLabel(ctx: CanvasRenderingContext2D, f: MergeFloatLabel) {
  const t = Math.min(1, f.life);
  const scale = f.pop * (0.85 + t * 0.35);
  const alpha = t * t;
  const isChain = f.combo >= 3;
  const isCombo = f.combo >= 2;

  ctx.save();
  ctx.translate(f.x, f.y);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;
  ctx.font = `bold ${f.big || isChain ? 15 : isCombo ? 13 : 11}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = isChain ? "#FF6B9D" : isCombo ? "#FFE048" : "#FFE048";
  ctx.strokeStyle = "rgba(0,0,0,0.7)";
  ctx.lineWidth = 4;
  ctx.strokeText(f.text, 0, 0);
  ctx.fillText(f.text, 0, 0);
  ctx.restore();
}

function drawMergeBursts(ctx: CanvasRenderingContext2D, bursts: MergeBurst[]) {
  for (const b of bursts) {
    const t = b.life;
    const def = tierDef(b.tier as MergeTierId);
    const r = def.radius * (0.5 + (1 - t) * 0.85);
    ctx.save();
    ctx.globalAlpha = t * 0.55;
    ctx.strokeStyle = b.tier >= 7 ? "#FF6B9D" : "#FFE048";
    ctx.lineWidth = 3 + (1 - t) * 4;
    ctx.beginPath();
    ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

export function paintMergeWorld(
  ctx: CanvasRenderingContext2D,
  engine: Matter.Engine,
  opts: {
    holding: { tier: MergeTierId; x: number; ready: boolean } | null;
    dangerActive: boolean;
    dangerFill: number;
    dangerPulse: number;
    scale: number;
    backgroundId: string;
    floats?: MergeFloatLabel[];
    bursts?: MergeBurst[];
    shakeX?: number;
    shakeY?: number;
  }
) {
  const s = opts.scale;
  const w = MERGE_WORLD.width;
  const h = MERGE_WORLD.height;
  const shakeX = opts.shakeX ?? 0;
  const shakeY = opts.shakeY ?? 0;

  ctx.save();
  ctx.scale(s, s);
  ctx.translate(shakeX, shakeY);

  const bg = getMergeBackgroundImage(opts.backgroundId);
  if (bg?.complete && bg.naturalWidth > 0) {
    drawBackgroundCover(ctx, bg, w, h);
    ctx.fillStyle = "rgba(5, 5, 5, 0.52)";
    ctx.fillRect(0, 0, w, h);
  } else {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#0a0a0e");
    g.addColorStop(1, "#050505");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  const dropY = dropLineY();
  const dangerY = DANGER_Y;
  const pulse = opts.dangerPulse;

  ctx.fillStyle = "rgba(255, 224, 72, 0.04)";
  ctx.fillRect(8, BIN_TOP, MERGE_WORLD.width - 16, dropY - BIN_TOP + 12);

  const dangerGlow = opts.dangerActive
    ? 0.06 + opts.dangerFill * 0.28 + Math.sin(pulse * 8) * 0.04 * opts.dangerFill
    : 0.03;
  ctx.fillStyle = `rgba(255, 95, 31, ${dangerGlow})`;
  ctx.fillRect(8, dangerY - 2, MERGE_WORLD.width - 16, 6);

  ctx.strokeStyle = "rgba(255, 224, 72, 0.18)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 6]);
  ctx.beginPath();
  ctx.moveTo(12, dropY);
  ctx.lineTo(MERGE_WORLD.width - 12, dropY);
  ctx.stroke();
  ctx.setLineDash([]);

  const lineAlpha = opts.dangerActive
    ? 0.45 + opts.dangerFill * 0.45 + Math.sin(pulse * 10) * 0.12
    : 0.4;
  ctx.strokeStyle = `rgba(255, ${opts.dangerActive ? 95 : 224}, 31, ${lineAlpha})`;
  ctx.lineWidth = opts.dangerActive ? 2 + opts.dangerFill * 2 : 2;
  ctx.setLineDash(opts.dangerActive ? [6, 4] : [8, 6]);
  ctx.beginPath();
  ctx.moveTo(8, dangerY);
  ctx.lineTo(MERGE_WORLD.width - 8, dangerY);
  ctx.stroke();
  ctx.setLineDash([]);

  if (opts.dangerActive) {
    const a = Math.min(1, opts.dangerFill) * (0.18 + Math.sin(pulse * 6) * 0.06);
    ctx.fillStyle = `rgba(255, 95, 31, ${a})`;
    ctx.fillRect(0, BIN_TOP, MERGE_WORLD.width, dangerY - BIN_TOP);
  }

  ctx.strokeStyle = "rgba(255, 224, 72, 0.12)";
  ctx.lineWidth = 3;
  ctx.strokeRect(4, 4, MERGE_WORLD.width - 8, MERGE_WORLD.height - 8);

  drawMergeBursts(ctx, opts.bursts ?? []);

  const bodies = Matter.Composite.allBodies(engine.world);
  for (const body of bodies) {
    const plugin = body.plugin as MergePiecePlugin | undefined;
    if (plugin?.vibe !== "merge") continue;
    const tier = plugin.mergeTier;
    const def = tierDef(tier);
    drawMergeDisc(ctx, body.position.x, body.position.y, tier, def.radius, body.angle, plugin, body.velocity.y);
  }

  for (const f of opts.floats ?? []) {
    if (f.life <= 0) continue;
    drawFloatLabel(ctx, f);
  }

  if (opts.holding) {
    const { tier, x, ready } = opts.holding;
    const def = tierDef(tier);
    const bob = ready ? Math.sin(pulse * 4) * 1.5 : 0;
    // Drop ghost — landing preview at stack height
    if (ready) {
      let landY = dropY;
      for (const body of bodies) {
        const plugin = body.plugin as MergePiecePlugin | undefined;
        if (plugin?.vibe !== "merge") continue;
        const dx = Math.abs(body.position.x - x);
        const r = tierDef(plugin.mergeTier).radius + def.radius;
        if (dx < r + 4) {
          landY = Math.min(landY, body.position.y - tierDef(plugin.mergeTier).radius - def.radius - 2);
        }
      }
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = "rgba(255, 224, 72, 0.35)";
      ctx.beginPath();
      ctx.ellipse(x, landY, def.radius * 0.92, def.radius * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 224, 72, 0.45)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.globalAlpha = ready ? 0.98 : 0.5;
    drawMergeDisc(ctx, x, dropY + bob, tier, def.radius, 0, {
      vibe: "merge",
      mergeTier: tier,
      mergeId: "hold",
      juicePop: ready ? 0.15 + Math.sin(pulse * 4) * 0.08 : 0,
    });
    ctx.globalAlpha = 1;
    if (!ready) {
      ctx.strokeStyle = "rgba(255, 224, 72, 0.22)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(def.radius + 8, dropY);
      ctx.lineTo(MERGE_WORLD.width - def.radius - 8, dropY);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  ctx.restore();
}

export function tierPreview(
  ctx: CanvasRenderingContext2D,
  tier: MergeTierId,
  cx: number,
  cy: number,
  size: number
) {
  drawMergeDisc(ctx, cx, cy, tier, size / 2, 0);
}
