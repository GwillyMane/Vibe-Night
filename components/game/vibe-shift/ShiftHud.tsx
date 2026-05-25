"use client";

import { CLASSIC_LEVEL_COUNT, DAILY_MOVE_BUDGET } from "@/lib/vibe-shift/shiftConfig";
import { classicLevelProgress } from "@/lib/vibe-shift/shiftClassic";
import { dailyMovesRemaining } from "@/lib/vibe-shift/shiftDaily";
import type { ShiftMode } from "@/lib/vibe-shift/shiftConfig";

export function ShiftHud({
  mode,
  score,
  level,
  movesUsed,
  scorePulse,
}: {
  mode: ShiftMode;
  score: number;
  level: number;
  movesUsed: number;
  scorePulse?: boolean;
}) {
  const progress = mode === "classic" ? classicLevelProgress(score, level) : null;

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-2 rounded-xl border border-gvc-gold/25 bg-black/60 px-3 py-2 backdrop-blur-md">
      <div className="font-display text-xs font-black uppercase tracking-widest text-gvc-gold">
        Score{" "}
        <span
          className={`text-base text-white transition-transform ${scorePulse ? "scale-110 text-gvc-gold" : ""}`}
        >
          {score.toLocaleString()}
        </span>
      </div>
      {mode === "classic" ? (
        <div className="flex flex-col items-end gap-1">
          <span className="font-body text-[10px] uppercase tracking-wider text-white/50">
            Level {level}/{CLASSIC_LEVEL_COUNT} · target {progress?.target.toLocaleString()}
          </span>
          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gvc-gold transition-all" style={{ width: `${progress?.pct ?? 0}%` }} />
          </div>
        </div>
      ) : (
        <div className="font-body text-xs uppercase tracking-wider text-white/60">
          Moves {movesUsed}/{DAILY_MOVE_BUDGET} · {dailyMovesRemaining(movesUsed)} left
        </div>
      )}
    </div>
  );
}
