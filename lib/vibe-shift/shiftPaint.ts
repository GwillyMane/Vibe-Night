import { GVC_COLOR_ACCENT } from "@/lib/assets/gvcLibraryFaces";
import type { Board, Cell } from "./shiftBoard";
import { getShiftFaceImage } from "./shiftFaces";
import type { ShiftColorId } from "./shiftConfig";
import { isFlashingCell, paintShiftJuice, popScaleForCell, type ShiftJuiceFx } from "./shiftJuice";
import { fallY, hiddenSlotsDuringFall, type FallMove } from "./shiftGravity";

import { SHIFT_BOARD_SIZE } from "./shiftConfig";

export const SHIFT_CELL_PAD = 4;

export interface DragPreview {
  axis: "row" | "col";
  index: number;
  offsetPx: number;
}

export interface PaintShiftOptions {
  highlightRow?: number | null;
  highlightCol?: number | null;
  flashCells?: Set<string>;
  reverting?: boolean;
  drag?: DragPreview | null;
  juice?: ShiftJuiceFx | null;
  clearingCells?: Set<string>;
  /** 0–1 fade-out for matched cells before they vanish */
  clearFade?: number;
  fallProgress?: number | null;
  falls?: FallMove[] | null;
  /** Board state during fall (cleared, pre-gravity layout) */
  fallBoard?: Board | null;
}

export function cellSize(board: Board, canvasSize = SHIFT_BOARD_SIZE): number {
  const cols = board[0]?.length ?? 8;
  return canvasSize / cols;
}

function drawCell(
  ctx: CanvasRenderingContext2D,
  cell: Cell,
  x: number,
  y: number,
  cs: number,
  opts?: { flash?: boolean; revert?: boolean; scale?: number; alpha?: number }
) {
  if (cell === null) return;
  const pad = SHIFT_CELL_PAD;
  const accent = GVC_COLOR_ACCENT[cell];
  const scale = opts?.scale ?? 1;
  const alpha = opts?.alpha ?? 1;
  const cx = x + cs / 2;
  const cy = y + cs / 2;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.translate(-cx, -cy);

  ctx.beginPath();
  ctx.roundRect(x + pad, y + pad, cs - pad * 2, cs - pad * 2, 10);
  ctx.fillStyle = opts?.revert
    ? "rgba(255,95,31,0.25)"
    : opts?.flash
      ? "rgba(255,224,72,0.45)"
      : "#121212";
  ctx.fill();
  ctx.strokeStyle = opts?.revert ? "#FF5F1F" : opts?.flash ? "#FFE048" : accent;
  ctx.lineWidth = opts?.flash ? 3.5 : 2;
  ctx.shadowColor = opts?.flash ? "#FFE048" : "transparent";
  ctx.shadowBlur = opts?.flash ? 14 : 0;
  ctx.stroke();
  ctx.shadowBlur = 0;

  const img = getShiftFaceImage(cell as ShiftColorId);
  if (img) {
    const inset = pad + 3;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x + inset, y + inset, cs - inset * 2, cs - inset * 2, 8);
    ctx.clip();
    ctx.drawImage(img, x + inset, y + inset, cs - inset * 2, cs - inset * 2);
    ctx.restore();
  } else {
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(x + cs / 2, y + cs / 2, cs * 0.22, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawLaneHighlight(
  ctx: CanvasRenderingContext2D,
  cs: number,
  rows: number,
  cols: number,
  axis: "row" | "col",
  index: number,
  active: boolean
) {
  ctx.fillStyle = active ? "rgba(255, 224, 72, 0.18)" : "rgba(255, 224, 72, 0.08)";
  if (axis === "row") ctx.fillRect(0, index * cs, cols * cs, cs);
  else ctx.fillRect(index * cs, 0, cs, rows * cs);
}

function drawWrappedCell(
  ctx: CanvasRenderingContext2D,
  cell: Cell,
  pos: number,
  crossPos: number,
  cs: number,
  axis: "row" | "col",
  laneSpan: number,
  opts?: { flash?: boolean; revert?: boolean; scale?: number; alpha?: number }
) {
  const span = laneSpan * cs;
  let p = pos % span;
  if (p < 0) p += span;
  for (const o of [p - span, p, p + span]) {
    if (axis === "row") {
      if (o < -cs * 0.5 || o > span + cs * 0.5) continue;
      drawCell(ctx, cell, o, crossPos, cs, opts);
    } else {
      if (o < -cs * 0.5 || o > span + cs * 0.5) continue;
      drawCell(ctx, cell, crossPos, o, cs, opts);
    }
  }
}

export function paintShiftBoard(ctx: CanvasRenderingContext2D, board: Board, opts?: PaintShiftOptions) {
  const size = SHIFT_BOARD_SIZE;
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, size, size);

  const cs = cellSize(board, size);
  const rows = board.length;
  const cols = board[0]?.length ?? 6;
  const drag = opts?.drag ?? null;
  const juice = opts?.juice ?? null;
  const clearing = opts?.clearingCells ?? new Set<string>();
  const clearFade = opts?.clearFade ?? 0;
  const fallProgress = opts?.fallProgress ?? null;
  const falls = opts?.falls ?? null;
  const fallBoard = opts?.fallBoard ?? null;
  const animatingFall = falls && fallProgress != null && fallProgress < 1;

  const paintBoard = animatingFall && fallBoard ? fallBoard : board;
  const hidden = animatingFall && falls ? hiddenSlotsDuringFall(falls, fallProgress!) : new Set<string>();

  if (drag) drawLaneHighlight(ctx, cs, rows, cols, drag.axis, drag.index, true);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = `${r},${c}`;
      if (hidden.has(key)) continue;

      const cell = paintBoard[r]![c];
      if (cell === null) continue;

      const flash = opts?.flashCells?.has(key) || (juice ? isFlashingCell(juice, r, c) : false);
      const isClearing = clearing.has(key);
      const popScale = juice ? popScaleForCell(juice, r, c) : 1;
      const cellOpts = {
        flash,
        revert: opts?.reverting,
        scale: isClearing ? Math.max(0.35, popScale * (1 - clearFade * 0.65)) : popScale,
        alpha: isClearing ? Math.max(0, 1 - clearFade) : 1,
      };

      const inDragRow = drag?.axis === "row" && drag.index === r;
      const inDragCol = drag?.axis === "col" && drag.index === c;

      if (inDragRow) {
        drawWrappedCell(ctx, cell, c * cs + drag.offsetPx, r * cs, cs, "row", cols, cellOpts);
        continue;
      }
      if (inDragCol) {
        drawWrappedCell(ctx, cell, r * cs + drag.offsetPx, c * cs, cs, "col", rows, cellOpts);
        continue;
      }

      drawCell(ctx, cell, c * cs, r * cs, cs, cellOpts);
    }
  }

  if (animatingFall && falls) {
    for (const f of falls) {
      const y = fallY(f, cs, fallProgress!);
      const x = f.col * cs;
      drawCell(ctx, f.cell, x, y, cs, { alpha: 1, scale: f.isNew ? 0.92 + fallProgress! * 0.08 : 1 });
    }
  }

  if (juice) paintShiftJuice(ctx, juice, cs);
}

export function moveFromDrag(
  axis: "row" | "col",
  index: number,
  offsetPx: number,
  cs: number
): import("./shiftBoard").ShiftMove | null {
  if (Math.abs(offsetPx) < cs * 0.2) return null;
  const dir: 1 | -1 = offsetPx > 0 ? 1 : -1;
  return { axis, index, dir };
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
