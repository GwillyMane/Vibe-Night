"use client";

import { useEffect, useRef } from "react";
import {
  colorDef,
  CORRUPTION_WARN,
  STABILITY_WARN,
  type GardenColorId,
} from "@/lib/vibe-garden/gardenConfig";
import { THREAT_LABEL, threatLevel, type ThreatLevel } from "@/lib/vibe-garden/gardenBalance";
import { drawPreviewChip } from "@/lib/vibe-garden/gardenPaint";

const THREAT_STYLE: Record<ThreatLevel, string> = {
  calm: "border-gvc-green/30 text-gvc-green",
  watch: "border-[#FFE048]/35 text-[#FFE048]",
  danger: "border-orange-500/45 text-orange-400",
  critical: "animate-pulse border-red-500/55 text-red-400",
};

function MeterBar({
  label,
  value,
  fillClass,
  warn,
  invertWarn,
}: {
  label: string;
  value: number;
  fillClass: string;
  warn?: boolean;
  invertWarn?: boolean;
}) {
  const low = invertWarn && value <= STABILITY_WARN;
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-0.5 flex justify-between gap-1 font-display text-[7px] font-bold uppercase tracking-wide text-white/40">
        <span className={warn || low ? "text-orange-400" : "truncate"}>{label}</span>
        <span className={`tabular-nums ${low ? "text-red-400" : ""}`}>{Math.round(value)}%</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full transition-all duration-300 ${low ? "bg-red-500" : fillClass}`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}

function gardenHealth(corruption: number, stability: number): number {
  return Math.round((100 - corruption) * 0.45 + stability * 0.55);
}

export function GardenHud({
  score,
  best,
  nextColor,
  combo,
  corruption,
  stability,
  riskMult,
  mode,
  dailySeed,
  dailyRemainingSec,
  onPause,
}: {
  score: number;
  best: number;
  nextColor: GardenColorId;
  combo: number;
  corruption: number;
  stability: number;
  riskMult: number;
  mode: "classic" | "daily" | "zen";
  dailySeed?: string;
  dailyRemainingSec?: number;
  onPause: () => void;
}) {
  const nextRef = useRef<HTMLCanvasElement>(null);
  const def = colorDef(nextColor);
  const warn = corruption >= CORRUPTION_WARN;
  const threat = threatLevel(corruption, stability);
  const metersExpanded = corruption > 40;
  const health = gardenHealth(corruption, stability);

  useEffect(() => {
    const c = nextRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, 36, 36);
    drawPreviewChip(ctx, nextColor, 36);
  }, [nextColor]);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 rounded-t-2xl" aria-live="polite">
      <div className="flex items-start justify-between gap-2 p-2 pt-[max(0.5rem,env(safe-area-inset-top))] pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))]">
        <div className="min-w-0 max-w-[58%] rounded-xl border border-gvc-gold/25 bg-black/70 px-2.5 py-2 shadow-lg backdrop-blur-sm sm:max-w-[220px]">
          {mode === "daily" ? (
            <p className="font-display text-[8px] font-bold uppercase tracking-wider text-white/40">
              Daily · {dailySeed ?? ""}
              {dailyRemainingSec !== undefined ? (
                <span className="ml-1.5 text-pink-accent">{dailyRemainingSec}s</span>
              ) : null}
            </p>
          ) : mode === "zen" ? (
            <p className="font-display text-[8px] font-bold uppercase tracking-wider text-white/40">Zen garden</p>
          ) : null}
          <p className="font-display text-[9px] font-bold uppercase tracking-widest text-white/45">Bloom</p>
          <p className="font-display text-xl font-black leading-tight tabular-nums text-gvc-gold sm:text-2xl">
            {score.toLocaleString()}
          </p>
          {mode !== "zen" ? (
            <p className="font-body text-[9px] text-white/50">Best {best.toLocaleString()}</p>
          ) : null}
          {mode !== "zen" && riskMult > 1.05 ? (
            <p className="mt-0.5 font-display text-[8px] font-bold uppercase text-pink-accent">
              Risk ×{riskMult.toFixed(2)}
            </p>
          ) : null}
          {mode !== "zen" ? (
            <div className="mt-1.5 flex items-center gap-2 border-t border-white/10 pt-1.5">
              <canvas ref={nextRef} width={36} height={36} className="shrink-0 rounded-full" aria-hidden />
              <div className="min-w-0">
                <p className="font-display text-[8px] font-bold uppercase tracking-wider text-white/45">Next</p>
                <p className="truncate font-body text-[11px] font-bold" style={{ color: def.accent }}>
                  {def.shortName}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-1.5 border-t border-white/10 pt-1.5 font-body text-[10px] leading-snug text-white/45">
              Tap soil to plant · pick a color on the right
            </p>
          )}
          {combo >= 2 ? (
            <p
              className={`mt-1 font-display font-black uppercase tracking-widest text-pink-accent ${
                combo >= 4 ? "animate-pulse text-sm" : "text-[9px]"
              }`}
            >
              Chain ×{combo}
            </p>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-1 flex-col items-stretch gap-2">
          <div className="flex items-center justify-end gap-1.5">
            {mode !== "zen" && !metersExpanded ? (
              <span
                className={`rounded-lg border bg-black/70 px-2 py-1 font-display text-[8px] font-black uppercase tracking-wider backdrop-blur-sm ${THREAT_STYLE[threat]}`}
              >
                {THREAT_LABEL[threat]}
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
          {mode !== "zen" ? (
            <div className="pointer-events-none flex flex-col gap-1.5 rounded-xl border border-white/10 bg-black/65 px-2 py-1.5 shadow-lg backdrop-blur-sm">
              {metersExpanded ? (
                <>
                  <MeterBar
                    label="Corruption"
                    value={corruption}
                    fillClass={warn ? "bg-orange-500" : "bg-[#FF5F1F]/80"}
                    warn={warn}
                  />
                  <MeterBar
                    label="Stability"
                    value={stability}
                    fillClass="bg-gvc-green/80"
                    invertWarn
                  />
                </>
              ) : (
                <MeterBar
                  label="Garden health"
                  value={health}
                  fillClass={health <= 45 ? "bg-orange-500" : "bg-gvc-green/80"}
                  warn={health <= 45}
                />
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
