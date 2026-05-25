"use client";

import { useEffect, useRef } from "react";
import type { SymbolAsset } from "@/lib/lucky-vibes/luckyAssets";
import { LUCKY_STAGE_SIZE, REELS, type LuckyMode, type SymbolId } from "@/lib/lucky-vibes/luckyConfig";
import type { Grid } from "@/lib/lucky-vibes/luckyGrid";
import type { LuckyJuiceFx } from "@/lib/lucky-vibes/luckyJuice";
import { emptyLuckyJuice, tickLuckyJuice } from "@/lib/lucky-vibes/luckyJuice";
import {
  paintExpandedReelHighlight,
  paintFeatureTint,
  paintJuiceOverlay,
  paintLuckyBackdrop,
  paintReelStripColumn,
  paintSettledColumn,
  cellSize,
} from "@/lib/lucky-vibes/luckyPaint";
import {
  buildReelStrip,
  columnFromGrid,
  settledScrollPx,
  STRIP_PREFIX_LEN,
} from "@/lib/lucky-vibes/luckyReelStrip";

export interface LuckyReelStageProps {
  grid: Grid | null;
  assets: Map<SymbolId, SymbolAsset>;
  winningKeys?: Set<string>;
  spinning?: boolean;
  reelStopMask?: number;
  juice?: LuckyJuiceFx;
  featureTint?: "none" | "luckySpins" | "vibeLock";
  lockedKeys?: Set<string>;
  /** Empty Vibe Lock cells mid-respin — pulsing blank slots. */
  rollingKeys?: Set<string>;
  reducedMotion?: boolean;
  spinSeed?: string;
  spinIndex?: number;
  mode?: LuckyMode;
  expandedReels?: number[];
}

interface ReelAnim {
  scroll: number;
  targetScroll: number;
  bounce: number;
  bounceVel: number;
  stopped: boolean;
  strip: SymbolId[];
}

const SPIN_SPEED = 2800;
const STOP_EASE = 8;

function initReels(grid: Grid, seed: string, spinIndex: number, mode: LuckyMode, ch: number): ReelAnim[] {
  return Array.from({ length: REELS }, (_, reel) => {
    const col = columnFromGrid(grid, reel);
    const strip = buildReelStrip(seed, spinIndex, reel, col, mode);
    return {
      scroll: 0,
      targetScroll: settledScrollPx(STRIP_PREFIX_LEN, ch),
      bounce: 0,
      bounceVel: 0,
      stopped: false,
      strip,
    };
  });
}

export function LuckyReelStage({
  grid,
  assets,
  winningKeys,
  spinning = false,
  reelStopMask = REELS,
  juice,
  featureTint = "none",
  lockedKeys,
  rollingKeys,
  reducedMotion = false,
  spinSeed = "idle",
  spinIndex = 0,
  mode = "classic",
  expandedReels = [],
}: LuckyReelStageProps) {
  const expandedSet = useRef(new Set(expandedReels));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const juiceRef = useRef(juice ?? emptyLuckyJuice());
  const timeRef = useRef(0);
  const reelsRef = useRef<ReelAnim[]>([]);
  const gridRef = useRef<Grid | null>(grid);
  const spinningRef = useRef(spinning);
  const stopMaskRef = useRef(reelStopMask);
  const lockedKeysRef = useRef(lockedKeys);
  const rollingKeysRef = useRef(rollingKeys);
  const rafRef = useRef(0);

  useEffect(() => {
    lockedKeysRef.current = lockedKeys;
  }, [lockedKeys]);

  useEffect(() => {
    rollingKeysRef.current = rollingKeys;
  }, [rollingKeys]);

  useEffect(() => {
    expandedSet.current = new Set(expandedReels);
  }, [expandedReels]);

  useEffect(() => {
    juiceRef.current = juice ?? emptyLuckyJuice();
  }, [juice]);

  useEffect(() => {
    gridRef.current = grid;
    stopMaskRef.current = reelStopMask;

    if (spinning && !spinningRef.current && grid) {
      const ch = cellSize(LUCKY_STAGE_SIZE).ch;
      reelsRef.current = initReels(grid, spinSeed, spinIndex, mode, ch);
    }
    spinningRef.current = spinning;
  }, [grid, spinning, reelStopMask, spinSeed, spinIndex, mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let last = performance.now();

    const columnOpts = (t: number, winKeys: Set<string>, dimWins: boolean) => ({
      winningKeys: winKeys,
      dimNonWinners: dimWins,
      lockedKeys: lockedKeysRef.current,
      rollingKeys: rollingKeysRef.current,
      juice: juiceRef.current,
      time: t,
      winPulse: t,
      featureTint,
      assets,
      expandedReels: expandedSet.current,
    });

    const loop = (now: number) => {
      const dt = Math.min(0.032, (now - last) / 1000);
      last = now;
      timeRef.current += dt;
      juiceRef.current = tickLuckyJuice(juiceRef.current, dt);

      const size = canvas.width;
      const t = timeRef.current;
      const reels = reelsRef.current;
      const g = gridRef.current;
      const isSpinning = spinningRef.current;
      const stopMask = stopMaskRef.current;

      if (g && reels.length === REELS && isSpinning && !reducedMotion) {
        for (let r = 0; r < REELS; r++) {
          const reel = reels[r]!;
          if (r < stopMask) {
            if (!reel.stopped) {
              reel.stopped = true;
              reel.bounceVel = -90;
            }
            const diff = reel.targetScroll - reel.scroll;
            reel.scroll += diff * Math.min(1, dt * STOP_EASE * 2.5);
            if (Math.abs(diff) < 0.5) reel.scroll = reel.targetScroll;
          } else {
            reel.stopped = false;
            reel.scroll += SPIN_SPEED * dt;
          }
          if (reel.stopped && Math.abs(reel.scroll - reel.targetScroll) < 2) {
            reel.bounceVel += 720 * dt;
            reel.bounce += reel.bounceVel * dt;
            reel.bounce *= 0.78;
            if (Math.abs(reel.bounce) < 0.25) reel.bounce = 0;
          }
        }
      } else if (reels.length === REELS) {
        for (const reel of reels) {
          reel.bounce *= 0.85;
          if (Math.abs(reel.bounce) < 0.2) reel.bounce = 0;
        }
      }

      ctx.clearRect(0, 0, size, size);
      paintLuckyBackdrop(ctx, size, t, featureTint);
      paintFeatureTint(ctx, size, featureTint, t);

      if (!g) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const winKeys = winningKeys ?? new Set<string>();
      const dimWins = winKeys.size > 0 && !isSpinning;
      const expanded = expandedSet.current;
      const drawOrder = Array.from({ length: REELS }, (_, i) => i).sort((a, b) => {
        const ae = expanded.has(a) ? 1 : 0;
        const be = expanded.has(b) ? 1 : 0;
        return ae - be;
      });

      if (isSpinning && !reducedMotion && reels.length === REELS) {
        for (const r of drawOrder) {
          const reel = reels[r]!;
          if (r < stopMask && reel.stopped && Math.abs(reel.scroll - reel.targetScroll) < 1) {
            paintSettledColumn(ctx, r, g, reel.bounce, size, assets, columnOpts(t, winKeys, dimWins));
          } else {
            paintReelStripColumn(ctx, r, reel.strip, reel.scroll, reel.bounce, size, assets, {
              time: t,
              motionBlur: !reel.stopped,
              expandedReels: expanded,
            });
          }
        }
      } else {
        for (const r of drawOrder) {
          const bounce = reels[r]?.bounce ?? 0;
          paintSettledColumn(ctx, r, g, bounce, size, assets, columnOpts(t, winKeys, dimWins));
        }
      }

      for (const r of expanded) {
        paintExpandedReelHighlight(ctx, r, size, t, expanded);
      }

      paintJuiceOverlay(ctx, size, {
        juice: juiceRef.current,
        time: t,
        assets,
      });

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [assets, winningKeys, featureTint, reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      width={LUCKY_STAGE_SIZE}
      height={LUCKY_STAGE_SIZE}
      className="h-full w-full"
      aria-label="Lucky Vibes slot reels"
    />
  );
}
