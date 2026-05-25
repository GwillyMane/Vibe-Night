"use client";

import { ArrowLeft, Pause, Play, RotateCcw, Target, Trophy, Volume2, VolumeX } from "lucide-react";
import { playUiClick } from "@/lib/sounds";

const btn =
  "inline-flex h-11 min-h-[44px] min-w-[44px] flex-1 items-center justify-center rounded-xl border border-white/[0.1] bg-gvc-dark/80 text-white/75 shadow-sm backdrop-blur-md transition active:scale-[0.98] hover:border-gvc-gold/35 hover:text-gvc-gold sm:h-12 sm:min-h-[48px]";

export interface GamePlayActionBarProps {
  muted: boolean;
  paused: boolean;
  onBack: () => void;
  onRestart: () => void;
  onPause: () => void;
  onToggleMute: () => void;
  onBadges?: () => void;
  onOpenLeaderboard?: () => void;
}

export function GamePlayActionBar({
  muted,
  paused,
  onBack,
  onRestart,
  onPause,
  onToggleMute,
  onBadges,
  onOpenLeaderboard,
}: GamePlayActionBarProps) {
  const c = () => playUiClick(muted);

  return (
    <div
      className="mt-2 flex w-full flex-col gap-2 px-0 pb-[max(4px,env(safe-area-inset-bottom))] pt-1"
      role="toolbar"
      aria-label="Game controls"
    >
      <div className="flex w-full gap-2">
        <button
          type="button"
          className={btn}
          aria-label="Back to menu"
          onClick={() => {
            c();
            onBack();
          }}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          className={btn}
          aria-label="Restart level"
          onClick={() => {
            c();
            onRestart();
          }}
        >
          <RotateCcw className="h-5 w-5" />
        </button>
        <button
          type="button"
          className={btn}
          aria-label={paused ? "Resume" : "Pause"}
          onClick={() => {
            c();
            onPause();
          }}
        >
          {paused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
        </button>
        <button
          type="button"
          className={btn}
          aria-label={muted ? "Unmute" : "Mute"}
          onClick={() => {
            c();
            onToggleMute();
          }}
        >
          {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
      </div>
      {onBadges || onOpenLeaderboard ? (
        <div className="flex w-full gap-2">
          {onBadges ? (
            <button
              type="button"
              className={btn}
              aria-label="Badges"
              onClick={() => {
                c();
                onBadges();
              }}
            >
              <Target className="h-5 w-5" />
            </button>
          ) : null}
          {onOpenLeaderboard ? (
            <button
              type="button"
              className={btn}
              aria-label="Leaderboard"
              onClick={() => {
                c();
                onOpenLeaderboard();
              }}
            >
              <Trophy className="h-5 w-5" />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
