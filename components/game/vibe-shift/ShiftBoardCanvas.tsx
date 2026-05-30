"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Board, ShiftMove } from "@/lib/vibe-shift/shiftBoard";
import { emptyShiftJuice, tickShiftJuice, type ShiftJuiceFx } from "@/lib/vibe-shift/shiftJuice";
import {
  cellSize,
  easeOutCubic,
  moveFromDrag,
  paintShiftBoard,
  type DragPreview,
} from "@/lib/vibe-shift/shiftPaint";
import { SHIFT_BOARD_SIZE } from "@/lib/vibe-shift/shiftConfig";

const SNAP_MS = 180;

type DragState = {
  r: number;
  c: number;
  startX: number;
  startY: number;
  axis: "row" | "col" | null;
  index: number;
  offsetPx: number;
};

type AnimState = {
  axis: "row" | "col";
  index: number;
  from: number;
  to: number;
  start: number;
  duration: number;
  onDone?: () => void;
};

export interface ShiftBoardCanvasProps {
  board: Board;
  disabled?: boolean;
  juice?: ShiftJuiceFx | null;
  clearingCells?: Set<string>;
  clearFade?: number;
  fallProgress?: number | null;
  falls?: import("@/lib/vibe-shift/shiftGravity").FallMove[] | null;
  fallBoard?: Board | null;
  onShift: (move: ShiftMove) => boolean;
}

export function ShiftBoardCanvas({
  board,
  disabled,
  juice,
  clearingCells,
  clearFade = 0,
  fallProgress = null,
  falls = null,
  fallBoard = null,
  onShift,
}: ShiftBoardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boardRef = useRef(board);
  const juiceRef = useRef(juice ?? emptyShiftJuice());
  const clearingRef = useRef(clearingCells ?? new Set<string>());
  const clearFadeRef = useRef(clearFade);
  const fallProgressRef = useRef(fallProgress);
  const fallsRef = useRef(falls);
  const fallBoardRef = useRef(fallBoard);
  const dragRef = useRef<DragState | null>(null);
  const animRef = useRef<AnimState | null>(null);
  const committedRef = useRef<DragPreview | null>(null);
  const busyRef = useRef(false);
  const rafRef = useRef<number>(0);
  const onShiftRef = useRef(onShift);
  const lastTickRef = useRef(performance.now());

  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

  boardRef.current = board;
  juiceRef.current = juice ?? juiceRef.current;
  clearingRef.current = clearingCells ?? clearingRef.current;
  clearFadeRef.current = clearFade;
  fallProgressRef.current = fallProgress;
  fallsRef.current = falls;
  fallBoardRef.current = fallBoard;
  onShiftRef.current = onShift;

  const cs = cellSize(board);

  const currentDrag = (): DragPreview | null => {
    if (disabledRef.current) return null;
    if (committedRef.current) return committedRef.current;
    const anim = animRef.current;
    if (anim) {
      const t = Math.min(1, (performance.now() - anim.start) / anim.duration);
      const eased = easeOutCubic(t);
      return {
        axis: anim.axis,
        index: anim.index,
        offsetPx: anim.from + (anim.to - anim.from) * eased,
      };
    }
    const drag = dragRef.current;
    if (!drag?.axis) return null;
    return { axis: drag.axis, index: drag.index, offsetPx: drag.offsetPx };
  };

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    paintShiftBoard(ctx, boardRef.current, {
      drag: currentDrag(),
      juice: juiceRef.current,
      clearingCells: clearingRef.current,
      clearFade: clearFadeRef.current,
      fallProgress: fallProgressRef.current,
      falls: fallsRef.current,
      fallBoard: fallBoardRef.current,
    });
  }, []);

  const startAnim = (anim: Omit<AnimState, "start">) => {
    animRef.current = { ...anim, start: performance.now() };
    busyRef.current = true;
  };

  const tick = useCallback(() => {
    const now = performance.now();
    const dt = Math.min(32, now - lastTickRef.current);
    lastTickRef.current = now;

    if (juiceRef.current.labels.length || juiceRef.current.particles.length || juiceRef.current.pops.length) {
      juiceRef.current = tickShiftJuice(juiceRef.current, dt);
    }

    const anim = animRef.current;
    if (anim) {
      const t = Math.min(1, (now - anim.start) / anim.duration);
      if (t >= 1) {
        const done = anim.onDone;
        animRef.current = null;
        done?.();
      }
    }

    paint();
    rafRef.current = requestAnimationFrame(tick);
  }, [paint]);

  useEffect(() => {
    lastTickRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tick]);

  useEffect(() => {
    if (juice) juiceRef.current = juice;
  }, [juice]);

  useEffect(() => {
    if (clearingCells) clearingRef.current = clearingCells;
  }, [clearingCells]);

  useEffect(() => {
    if (disabled) {
      committedRef.current = null;
      animRef.current = null;
      dragRef.current = null;
      busyRef.current = false;
      return;
    }
    committedRef.current = null;
    dragRef.current = null;
    animRef.current = null;
    busyRef.current = false;
  }, [board, disabled]);

  const cellFromEvent = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * SHIFT_BOARD_SIZE;
    const y = ((clientY - rect.top) / rect.height) * SHIFT_BOARD_SIZE;
    const cols = boardRef.current[0]?.length ?? 8;
    const c = Math.floor(x / cs);
    const r = Math.floor(y / cs);
    if (r < 0 || c < 0 || r >= boardRef.current.length || c >= cols) return null;
    return { r, c };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled || busyRef.current) return;
    const cell = cellFromEvent(e.clientX, e.clientY);
    if (!cell) return;
    dragRef.current = {
      r: cell.r,
      c: cell.c,
      startX: e.clientX,
      startY: e.clientY,
      axis: null,
      index: 0,
      offsetPx: 0,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || animRef.current || committedRef.current) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = SHIFT_BOARD_SIZE / rect.width;
    const scaleY = SHIFT_BOARD_SIZE / rect.height;
    const dx = (e.clientX - d.startX) * scaleX;
    const dy = (e.clientY - d.startY) * scaleY;
    const mag = Math.max(Math.abs(dx), Math.abs(dy));
    if (mag < cs * 0.08) {
      d.axis = null;
      d.offsetPx = 0;
      return;
    }
    d.axis = Math.abs(dx) > Math.abs(dy) ? "row" : "col";
    d.index = d.axis === "row" ? d.r : d.c;
    d.offsetPx = d.axis === "row" ? dx : dy;
  };

  const onPointerUp = () => {
    const d = dragRef.current;
    if (!d || animRef.current || committedRef.current) {
      dragRef.current = null;
      return;
    }
    if (!d.axis || disabled || busyRef.current) {
      dragRef.current = null;
      return;
    }

    const offsetPx = d.offsetPx;
    const move = moveFromDrag(d.axis, d.index, offsetPx, cs);
    if (!move) {
      startAnim({
        axis: d.axis,
        index: d.index,
        from: offsetPx,
        to: 0,
        duration: SNAP_MS,
        onDone: () => {
          busyRef.current = false;
          dragRef.current = null;
        },
      });
      return;
    }

    const target = move.dir * cs;
    const axis = d.axis;
    const index = d.index;
    dragRef.current = null;

    startAnim({
      axis,
      index,
      from: offsetPx,
      to: target,
      duration: SNAP_MS,
      onDone: () => {
        const accepted = onShiftRef.current(move);
        if (!accepted) {
          startAnim({
            axis,
            index,
            from: target,
            to: 0,
            duration: SNAP_MS,
            onDone: () => {
              busyRef.current = false;
            },
          });
          return;
        }
        committedRef.current = { axis, index, offsetPx: target };
      },
    });
  };

  const onPointerCancel = () => {
    onPointerUp();
  };

  return (
    <canvas
      ref={canvasRef}
      width={SHIFT_BOARD_SIZE}
      height={SHIFT_BOARD_SIZE}
      className="aspect-square w-full max-h-[min(72vh,88vw)] cursor-grab touch-none select-none rounded-2xl border border-gvc-gold/20 shadow-lg active:cursor-grabbing"
      style={{ touchAction: "none" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onLostPointerCapture={onPointerUp}
      aria-label="Vibe Shift game board — drag a row or column to shift"
    />
  );
}
