"use client";

import { BAD_VIBE_MAX_STRIKES } from "@/lib/catch-a-vibe/catchConfig";
import { dailyHudLabel } from "@/lib/arcade/dailyCopy";

export function CatchHud({
  score,
  best,
  combo,
  badStrikes,
  mode,
  dailySeed,
  onPause,
}: {
  score: number;
  best: number;
  combo: number;
  maxCombo: number;
  badStrikes: number;
  mode: "classic" | "daily" | "zen";
  dailySeed?: string;
  onPause: () => void;
}) {
  const strikesWarn = badStrikes >= 2;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 rounded-t-2xl" aria-live="polite">
      <div className="flex items-start justify-between gap-2 p-2 pt-[max(0.5rem,env(safe-area-inset-top))] pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))]">
        <div className="min-w-0 rounded-xl border border-gvc-gold/25 bg-black/70 px-2.5 py-1.5 shadow-lg backdrop-blur-sm">
          {mode === "daily" ? (
            <p className="font-display text-[8px] font-bold uppercase tracking-wider text-white/40">
              {dailyHudLabel(dailySeed ?? "")}
            </p>
          ) : mode === "zen" ? (
            <p className="font-display text-[8px] font-bold uppercase tracking-wider text-white/40">Zen catch</p>
          ) : null}
          <div className="flex items-baseline gap-2">
            <p className="font-display text-xl font-black tabular-nums text-gvc-gold sm:text-2xl">{score.toLocaleString()}</p>
            {combo >= 2 ? (
              <p
                className={`font-display font-black uppercase text-pink-accent ${
                  combo >= 5 ? "animate-pulse text-sm" : "text-[9px]"
                }`}
              >
                ×{combo}
              </p>
            ) : null}
          </div>
          {mode !== "zen" ? (
            <p className="font-body text-[9px] text-white/45">Best {best.toLocaleString()}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {mode !== "zen" ? (
            <div
              className={`flex items-center gap-1 rounded-lg border bg-black/70 px-2 py-1 backdrop-blur-sm ${
                strikesWarn
                  ? "animate-pulse border-red-500/55"
                  : badStrikes >= 1
                    ? "border-orange-500/45"
                    : "border-white/10"
              }`}
              title="Bad vibe strikes"
            >
              {Array.from({ length: BAD_VIBE_MAX_STRIKES }).map((_, i) => (
                <span
                  key={i}
                  className={`h-2 w-2 rounded-full ${i < badStrikes ? "bg-purple-400 shadow-[0_0_6px_rgba(176,107,255,0.7)]" : "bg-white/15"}`}
                />
              ))}
            </div>
          ) : null}
          <button
            type="button"
            onClick={onPause}
            className="pointer-events-auto min-h-[36px] rounded-xl border border-white/15 bg-black/70 px-2.5 font-display text-[9px] font-bold uppercase text-white/85 shadow-lg backdrop-blur-sm"
          >
            Pause
          </button>
        </div>
      </div>
    </div>
  );
}
