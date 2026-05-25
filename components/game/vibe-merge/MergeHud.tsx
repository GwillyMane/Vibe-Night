"use client";

import { tierDef } from "@/lib/vibe-merge/mergeConfig";
import type { MergeTierId } from "@/lib/vibe-merge/mergeConfig";
import { tierPreview } from "@/lib/vibe-merge/mergePaint";
import { useEffect, useRef } from "react";

const PREVIEW_SIZE = 48;

export function MergeHud({
  score,
  best,
  nextTier,
  combo,
  mode,
  dailySeed,
  dangerNear,
  onPause,
}: {
  score: number;
  best: number;
  currentTier: MergeTierId;
  nextTier: MergeTierId;
  canDrop: boolean;
  combo: number;
  mode: "classic" | "daily";
  dailySeed?: string;
  dangerNear?: boolean;
  onPause: () => void;
  muted: boolean;
}) {
  const nextRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = nextRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
    tierPreview(ctx, nextTier, PREVIEW_SIZE / 2, PREVIEW_SIZE / 2, PREVIEW_SIZE - 4);
  }, [nextTier]);

  const nextDef = tierDef(nextTier);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between rounded-2xl"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-2 p-2 pt-[max(0.5rem,env(safe-area-inset-top))] pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))]">
        <div className="min-w-0 rounded-xl border border-gvc-gold/25 bg-black/70 px-2.5 py-2 shadow-lg backdrop-blur-sm">
          {mode === "daily" ? (
            <p className="font-display text-[8px] font-bold uppercase tracking-wider text-white/40">
              Daily · {dailySeed ?? ""}
            </p>
          ) : null}
          <p className="font-display text-[9px] font-bold uppercase tracking-widest text-white/45">Score</p>
          <p className="font-display text-xl font-black leading-tight tabular-nums text-gvc-gold sm:text-2xl">
            {score.toLocaleString()}
          </p>
          <p className="font-body text-[9px] text-white/50">Best {best.toLocaleString()}</p>
          <div className="mt-1.5 flex items-center gap-2 border-t border-white/10 pt-1.5">
            <canvas
              ref={nextRef}
              width={PREVIEW_SIZE}
              height={PREVIEW_SIZE}
              className="shrink-0 rounded-full"
              aria-hidden
            />
            <div className="min-w-0">
              <p className="font-display text-[8px] font-bold uppercase tracking-wider text-white/45">Next</p>
              <p className="truncate font-body text-[11px] font-bold text-gvc-gold">{nextDef.shortName}</p>
            </div>
          </div>
          {combo >= 2 ? (
            <p
              className={`mt-1 font-display font-black uppercase tracking-widest text-pink-accent ${
                combo >= 4 ? "animate-pulse text-sm" : combo >= 3 ? "text-[11px]" : "text-[9px]"
              }`}
            >
              {combo >= 4 ? "MEGA " : ""}Chain ×{combo}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col items-end gap-1.5">
          {dangerNear ? (
            <span className="animate-pulse rounded-lg border border-red-500/55 bg-red-500/15 px-2 py-1 font-display text-[8px] font-black uppercase tracking-wider text-red-400 backdrop-blur-sm">
              Danger
            </span>
          ) : null}
          <button
            type="button"
            onClick={onPause}
            className="pointer-events-auto shrink-0 min-h-[36px] rounded-xl border border-white/15 bg-black/70 px-2.5 font-display text-[9px] font-bold uppercase text-white/85 shadow-lg backdrop-blur-sm"
          >
            Pause
          </button>
        </div>
      </div>
    </div>
  );
}
