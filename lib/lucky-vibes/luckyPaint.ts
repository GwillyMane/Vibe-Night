import type { SymbolAsset } from "./luckyAssets";
import { faceIdFromSymbol, getCachedImage } from "./luckyAssets";
import { GVC_COLOR_ACCENT } from "@/lib/assets/gvcLibraryFaces";
import { LUCKY_STAGE_SIZE, REELS, ROWS, type SymbolId } from "./luckyConfig";
import type { Grid } from "./luckyGrid";
import { cellKey } from "./luckyGrid";
import type { LuckyJuiceFx } from "./luckyJuice";

export const LUCKY_CELL_PAD = 4;

export function cellSize(canvasSize = LUCKY_STAGE_SIZE): { cw: number; ch: number } {
  return { cw: canvasSize / REELS, ch: canvasSize / ROWS };
}

export interface PaintLuckyOptions {
  assets: Map<SymbolId, SymbolAsset>;
  winningKeys?: Set<string>;
  dimNonWinners?: boolean;
  lockedKeys?: Set<string>;
  rollingKeys?: Set<string>;
  spinning?: boolean;
  juice?: LuckyJuiceFx | null;
  time?: number;
  winPulse?: number;
  featureTint?: "none" | "luckySpins" | "vibeLock";
  expandedReels?: Set<number>;
}

function reelColumnTransform(
  ctx: CanvasRenderingContext2D,
  reel: number,
  cw: number,
  canvasSize: number,
  expandedReels?: Set<number>
): boolean {
  if (!expandedReels?.has(reel)) return false;
  const cx = reel * cw + cw / 2;
  const cy = canvasSize / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1.18, 1.1);
  ctx.translate(-cx, -cy);
  return true;
}

export function paintExpandedReelHighlight(
  ctx: CanvasRenderingContext2D,
  reel: number,
  canvasSize: number,
  time: number,
  expandedReels?: Set<number>
) {
  if (!expandedReels?.has(reel)) return;
  const { cw } = cellSize(canvasSize);
  const x = reel * cw + 2;
  const w = cw - 4;
  const pulse = 0.55 + Math.sin(time * 5 + reel) * 0.25;
  ctx.strokeStyle = `rgba(255,224,72,${pulse})`;
  ctx.lineWidth = 3;
  ctx.shadowColor = "#FFE048";
  ctx.shadowBlur = 16;
  ctx.strokeRect(x, 8, w, canvasSize - 16);
  ctx.shadowBlur = 0;
}

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function isPremiumToken(sym: SymbolId): boolean {
  return sym.startsWith("token:");
}

function isFeatureSymbol(sym: SymbolId): boolean {
  return sym === "scatter" || sym === "orb";
}

function drawFeatureSymbolGlow(
  ctx: CanvasRenderingContext2D,
  sym: "scatter" | "orb",
  rx: number,
  ry: number,
  rw: number,
  rh: number,
  time: number
) {
  const cx = rx + rw / 2;
  const cy = ry + rh / 2;
  const pulse = 1 + Math.sin(time * 4) * 0.08;
  const r = Math.min(rw, rh) * 0.42 * pulse;
  const g = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
  if (sym === "scatter") {
    g.addColorStop(0, "rgba(255,107,157,0.45)");
    g.addColorStop(0.6, "rgba(255,224,72,0.2)");
    g.addColorStop(1, "rgba(255,107,157,0)");
  } else {
    g.addColorStop(0, "rgba(107,157,255,0.4)");
    g.addColorStop(0.6, "rgba(255,224,72,0.18)");
    g.addColorStop(1, "rgba(107,157,255,0)");
  }
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
}

function imageDimensions(img: HTMLImageElement): { w: number; h: number } {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  return { w: Math.max(1, w), h: Math.max(1, h) };
}

/** Fill the cell, preserve aspect ratio, center-crop overflow (like object-fit: cover). */
function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
  inset: number,
  imageScale = 1
) {
  const { w: iw, h: ih } = imageDimensions(img);
  const boxW = rw - inset * 2;
  const boxH = rh - inset * 2;
  const scale = Math.max(boxW / iw, boxH / ih) * imageScale;
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = rx + inset + (boxW - dw) / 2;
  const dy = ry + inset + (boxH - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
}

function symbolImageScale(sym: SymbolId): number {
  if (sym === "wild" || sym === "scatter") return 0.82;
  return 1;
}

function drawPremiumOverlay(ctx: CanvasRenderingContext2D, sym: SymbolId, rx: number, ry: number, rw: number, rh: number, time: number) {
  if (sym === "token:430") {
    const g = ctx.createLinearGradient(rx, ry, rx + rw, ry + rh);
    const shift = (Math.sin(time * 3) + 1) / 2;
    g.addColorStop(0, `rgba(107,255,255,${0.15 + shift * 0.2})`);
    g.addColorStop(0.5, `rgba(180,120,255,${0.1 + shift * 0.15})`);
    g.addColorStop(1, `rgba(255,107,157,${0.12 + shift * 0.18})`);
    ctx.fillStyle = g;
    ctx.fillRect(rx, ry, rw, rh);
  } else if (sym === "token:1151") {
    ctx.strokeStyle = `rgba(100,200,255,${0.5 + Math.sin(time * 8) * 0.3})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(rx + 2, ry + 2, rw - 4, rh - 4);
  } else if (sym === "token:1400") {
    ctx.shadowColor = "#FFE048";
    ctx.shadowBlur = 12 + Math.sin(time * 5) * 6;
    ctx.strokeStyle = "rgba(255,224,72,0.85)";
    ctx.lineWidth = 2.5;
    ctx.strokeRect(rx + 1, ry + 1, rw - 2, rh - 2);
    ctx.shadowBlur = 0;
  } else if (sym === "wild") {
    ctx.shadowColor = "#FFE048";
    ctx.shadowBlur = 14 + Math.sin(time * 6) * 4;
    ctx.strokeStyle = "#FFE048";
    ctx.lineWidth = 2;
    ctx.strokeRect(rx + 2, ry + 2, rw - 4, rh - 4);
    ctx.shadowBlur = 0;
  }
}

function drawSymbolCell(
  ctx: CanvasRenderingContext2D,
  sym: SymbolId,
  x: number,
  y: number,
  w: number,
  h: number,
  assets: Map<SymbolId, SymbolAsset>,
  opts: {
    flash?: boolean;
    dim?: boolean;
    locked?: boolean;
    rolling?: boolean;
    scale?: number;
    time?: number;
    motionBlur?: boolean;
  }
) {
  const pad = LUCKY_CELL_PAD;
  const asset = assets.get(sym);
  const accent = asset?.accent ?? "#FFE048";
  const alpha = opts.dim ? 0.35 : 1;
  const time = opts.time ?? 0;
  const scale = opts.scale ?? 1;

  ctx.save();
  ctx.globalAlpha = alpha;

  const cx = x + w / 2;
  const cy = y + h / 2;
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.translate(-cx, -cy);

  const rx = x + pad;
  const ry = y + pad;
  const rw = w - pad * 2;
  const rh = h - pad * 2;

  if (opts.motionBlur) {
    ctx.globalAlpha = alpha * 0.25;
    ctx.filter = "blur(3px)";
  }

  const bgGrad = ctx.createLinearGradient(rx, ry, rx, ry + rh);
  if (opts.locked) {
    bgGrad.addColorStop(0, "rgba(255,224,72,0.35)");
    bgGrad.addColorStop(1, "rgba(255,95,31,0.2)");
  } else if (opts.flash) {
    bgGrad.addColorStop(0, "rgba(255,224,72,0.55)");
    bgGrad.addColorStop(1, "rgba(255,107,157,0.25)");
  } else if (isPremiumToken(sym) || sym === "wild") {
    bgGrad.addColorStop(0, "rgba(28,22,38,0.98)");
    bgGrad.addColorStop(1, "rgba(12,10,18,0.98)");
  } else if (isFeatureSymbol(sym)) {
    bgGrad.addColorStop(0, sym === "scatter" ? "rgba(40,16,32,0.98)" : "rgba(12,20,40,0.98)");
    bgGrad.addColorStop(1, "rgba(10,10,14,0.98)");
  } else {
    bgGrad.addColorStop(0, "rgba(24,24,32,0.96)");
    bgGrad.addColorStop(1, "rgba(10,10,14,0.98)");
  }

  ctx.beginPath();
  ctx.roundRect(rx, ry, rw, rh, 12);
  ctx.fillStyle = bgGrad;
  ctx.fill();

  ctx.strokeStyle = opts.flash
    ? "#FFE048"
    : opts.locked
      ? "#FFE048"
      : isPremiumToken(sym) || sym === "wild"
        ? "rgba(255,224,72,0.55)"
        : isFeatureSymbol(sym)
          ? sym === "scatter"
            ? "rgba(255,107,157,0.65)"
            : "rgba(107,157,255,0.65)"
          : `${accent}66`;
  ctx.lineWidth = opts.flash ? 3.5 : isPremiumToken(sym) ? 2 : 1.5;
  if (opts.flash) {
    ctx.shadowColor = "#FFE048";
    ctx.shadowBlur = 22;
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.filter = "none";

  const url = asset?.imageUrl ?? null;
  const img = getCachedImage(url);
  const faceId = faceIdFromSymbol(sym);
  const inset = sym === "wild" || isFeatureSymbol(sym) ? 3 : 4;

  if (sym === "blank") {
    if (opts.rolling) {
      const pulse = 0.4 + Math.sin(time * 14) * 0.35;
      ctx.fillStyle = `rgba(107,157,255,${pulse * 0.22})`;
      ctx.beginPath();
      ctx.roundRect(rx, ry, rw, rh, 12);
      ctx.fill();
      ctx.strokeStyle = `rgba(255,224,72,${0.25 + Math.sin(time * 10) * 0.35})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.stroke();
    } else {
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = `rgba(107,157,255,${0.18 + Math.sin(time * 3) * 0.08})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
    return;
  }

  if (sym === "scatter" || sym === "orb") {
    drawFeatureSymbolGlow(ctx, sym, rx, ry, rw, rh, time);
  }

  if (img) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(rx + inset, ry + inset, rw - inset * 2, rh - inset * 2, 10);
    ctx.clip();
    drawCoverImage(ctx, img, rx, ry, rw, rh, inset, symbolImageScale(sym));
    ctx.restore();
    if (isPremiumToken(sym)) drawPremiumOverlay(ctx, sym, rx, ry, rw, rh, time);
  } else if (faceId !== null) {
    ctx.fillStyle = GVC_COLOR_ACCENT[faceId]!;
    ctx.shadowColor = GVC_COLOR_ACCENT[faceId]!;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(rx + rw / 2, ry + rh / 2, Math.min(rw, rh) * 0.24, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  ctx.restore();
}

/** Draw one reel column from a vertical symbol strip. */
export function paintReelStripColumn(
  ctx: CanvasRenderingContext2D,
  reel: number,
  strip: SymbolId[],
  scrollPx: number,
  bouncePx: number,
  canvasSize: number,
  assets: Map<SymbolId, SymbolAsset>,
  opts: { time: number; motionBlur?: boolean; expandedReels?: Set<number> }
) {
  const { cw, ch } = cellSize(canvasSize);
  const x = reel * cw;
  const totalH = strip.length * ch;
  const scroll = ((scrollPx % totalH) + totalH) % totalH;
  const yBase = -scroll + bouncePx;

  const expanded = reelColumnTransform(ctx, reel, cw, canvasSize, opts.expandedReels);

  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 1, 0, cw - 2, canvasSize);
  ctx.clip();

  const startIdx = Math.floor(scroll / ch) - 1;
  const endIdx = startIdx + ROWS + 4;
  for (let i = startIdx; i <= endIdx; i++) {
    const sym = strip[((i % strip.length) + strip.length) % strip.length]!;
    const y = yBase + i * ch;
    if (opts.motionBlur) {
      drawSymbolCell(ctx, sym, x, y - 10, cw, ch, assets, { time: opts.time, motionBlur: true });
      drawSymbolCell(ctx, sym, x, y - 5, cw, ch, assets, { time: opts.time, motionBlur: true });
    }
    drawSymbolCell(ctx, sym, x, y, cw, ch, assets, { time: opts.time, motionBlur: opts.motionBlur });
  }
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = "rgba(255,224,72,0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + cw, 0);
  ctx.lineTo(x + cw, canvasSize);
  ctx.stroke();
  ctx.restore();

  if (expanded) ctx.restore();
}
export function paintSettledColumn(
  ctx: CanvasRenderingContext2D,
  reel: number,
  grid: Grid,
  bouncePx: number,
  canvasSize: number,
  assets: Map<SymbolId, SymbolAsset>,
  opts: PaintLuckyOptions
) {
  const { cw, ch } = cellSize(canvasSize);
  const winKeys = opts.winningKeys ?? new Set<string>();
  const time = opts.time ?? 0;
  const pulse = opts.winPulse ?? 0;

  const expanded = reelColumnTransform(ctx, reel, cw, canvasSize, opts.expandedReels);

  ctx.save();
  ctx.beginPath();
  ctx.rect(reel * cw + 1, 0, cw - 2, canvasSize);
  ctx.clip();

  for (let y = 0; y < ROWS; y++) {
    const sym = grid[reel]![y]!;
    const key = cellKey({ reel, row: y });
    const isWin = winKeys.has(key);
    const dim = opts.dimNonWinners && winKeys.size > 0 && !isWin;
    const flash = isWin || opts.juice?.flashKeys.has(key);
    const scale = flash ? 1 + Math.sin(pulse * 8) * 0.06 : 1;
    drawSymbolCell(ctx, sym, reel * cw, y * ch + bouncePx, cw, ch, assets, {
      flash,
      dim,
      locked: opts.lockedKeys?.has(key),
      rolling: opts.rollingKeys?.has(key),
      scale,
      time,
    });
  }
  ctx.restore();

  if (expanded) ctx.restore();
}

/** Draw a single settled cell (for Vibe Lock locked overlays). */
export function paintGridCell(
  ctx: CanvasRenderingContext2D,
  grid: Grid,
  reel: number,
  row: number,
  bouncePx: number,
  canvasSize: number,
  assets: Map<SymbolId, SymbolAsset>,
  opts: PaintLuckyOptions
) {
  const { cw, ch } = cellSize(canvasSize);
  const sym = grid[reel]![row]!;
  const key = cellKey({ reel, row });
  const isWin = opts.winningKeys?.has(key);
  const time = opts.time ?? 0;
  drawSymbolCell(ctx, sym, reel * cw, row * ch + bouncePx, cw, ch, assets, {
    flash: isWin || opts.juice?.flashKeys.has(key),
    dim: opts.dimNonWinners && (opts.winningKeys?.size ?? 0) > 0 && !isWin,
    locked: opts.lockedKeys?.has(key),
    scale: 1,
    time,
  });
}

export function paintLuckyGridSettled(ctx: CanvasRenderingContext2D, grid: Grid, canvasSize: number, opts: PaintLuckyOptions) {
  for (let r = 0; r < REELS; r++) {
    paintSettledColumn(ctx, r, grid, 0, canvasSize, opts.assets, opts);
  }
  paintJuiceOverlay(ctx, canvasSize, opts);
}

export function paintJuiceOverlay(ctx: CanvasRenderingContext2D, canvasSize: number, opts: PaintLuckyOptions) {
  if (!opts.juice) return;
  const juice = opts.juice;

  if (juice.screenFlash > 0) {
    ctx.fillStyle = `rgba(255,224,72,${juice.screenFlash * 0.45})`;
    ctx.fillRect(0, 0, canvasSize, canvasSize);
  }

  for (const p of juice.particles) {
    const a = p.life / p.maxLife;
    ctx.globalAlpha = a;
    if (p.kind === "ring") {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.stroke();
      continue;
    }
    if (p.kind === "coin") {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot ?? 0);
      ctx.fillStyle = p.color;
      ctx.shadowColor = "#FFE048";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      continue;
    }
    ctx.shadowColor = p.color;
    ctx.shadowBlur = p.size * 2;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;

  for (const l of juice.labels) {
    const a = l.life / l.maxLife;
    ctx.globalAlpha = a;
    ctx.font = `900 ${l.big ? 26 : 18}px sans-serif`;
    ctx.textAlign = "center";
    ctx.shadowColor = l.color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = l.color;
    ctx.fillText(l.text, l.x, l.y);
    ctx.shadowBlur = 0;
  }
  ctx.globalAlpha = 1;

  if (juice.winBanner && juice.winBannerLife > 0) {
    const a = Math.min(1, juice.winBannerLife);
    ctx.globalAlpha = a;
    ctx.font = "900 32px sans-serif";
    ctx.fillStyle = "#FFE048";
    ctx.textAlign = "center";
    ctx.shadowColor = "#FFE048";
    ctx.shadowBlur = 20;
    ctx.fillText(juice.winBanner, canvasSize / 2, canvasSize * 0.1);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
}

export function paintLuckyBackdrop(
  ctx: CanvasRenderingContext2D,
  size: number,
  t: number,
  featureTint: "none" | "luckySpins" | "vibeLock" = "none"
) {
  const bg = ctx.createRadialGradient(size * 0.5, size * 0.35, size * 0.05, size * 0.5, size * 0.5, size * 0.75);
  bg.addColorStop(0, featureTint === "luckySpins" ? "#2a1028" : featureTint === "vibeLock" ? "#0a1830" : "#1a1230");
  bg.addColorStop(0.55, "#0a0812");
  bg.addColorStop(1, "#030306");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 3; i++) {
    const ox = size * (0.2 + i * 0.28) + Math.sin(t * 0.4 + i) * 20;
    const oy = size * (0.15 + i * 0.2) + Math.cos(t * 0.35 + i * 2) * 15;
    const r = size * (0.22 + i * 0.06);
    const blob = ctx.createRadialGradient(ox, oy, 0, ox, oy, r);
    const colors =
      i === 0 ? ["rgba(255,107,157,0.12)", "transparent"] : i === 1 ? ["rgba(255,224,72,0.1)", "transparent"] : ["rgba(107,157,255,0.08)", "transparent"];
    blob.addColorStop(0, colors[0]!);
    blob.addColorStop(1, colors[1]!);
    ctx.fillStyle = blob;
    ctx.fillRect(0, 0, size, size);
  }

  const { ch } = cellSize(size);
  const midY = ch * 2.5;
  const band = ctx.createLinearGradient(0, midY - ch * 0.55, 0, midY + ch * 0.55);
  band.addColorStop(0, "rgba(255,224,72,0)");
  band.addColorStop(0.5, "rgba(255,224,72,0.07)");
  band.addColorStop(1, "rgba(255,224,72,0)");
  ctx.fillStyle = band;
  ctx.fillRect(12, midY - ch * 0.55, size - 24, ch * 1.1);

  ctx.strokeStyle = "rgba(255,224,72,0.2)";
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, size - 20, size - 20);

  ctx.strokeStyle = "rgba(255,224,72,0.06)";
  ctx.lineWidth = 1;
  ctx.strokeRect(16, 16, size - 32, size - 32);

  const vig = ctx.createRadialGradient(size / 2, size / 2, size * 0.35, size / 2, size / 2, size * 0.72);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, size, size);
}

export function paintFeatureTint(ctx: CanvasRenderingContext2D, size: number, featureTint: "none" | "luckySpins" | "vibeLock", t: number) {
  if (featureTint === "none") return;
  const pulse = 0.06 + Math.sin(t * 2) * 0.03;
  ctx.fillStyle = featureTint === "luckySpins" ? `rgba(255,107,157,${pulse})` : `rgba(107,157,255,${pulse})`;
  ctx.fillRect(0, 0, size, size);
}
