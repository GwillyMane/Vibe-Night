"use client";

import { Volume2, VolumeX } from "lucide-react";

export function VolumeControl({
  volume,
  muted,
  onVolume,
  onToggleMute,
}: {
  volume: number;
  muted: boolean;
  onVolume: (v: number) => void;
  onToggleMute: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onToggleMute}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 text-white/70 transition hover:border-gvc-gold/35 hover:text-gvc-gold"
        aria-label={muted ? "Unmute music" : "Mute music"}
      >
        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={muted ? 0 : volume}
        onChange={(e) => onVolume(Number(e.target.value))}
        className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/10 accent-gvc-gold"
        aria-label="Music volume"
      />
    </div>
  );
}
