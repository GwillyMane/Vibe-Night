"use client";

import { ChevronUp, Pause, Play } from "lucide-react";
import { useGlobalAudio } from "@/contexts/GlobalAudioContext";
import { getTrack } from "@/lib/audio/soundtrack";
import { PlayerVisualizer } from "./PlayerVisualizer";

export function MiniPlayer({
  reducedMotion,
  compact = false,
  onExpand,
}: {
  reducedMotion: boolean;
  compact?: boolean;
  onExpand: () => void;
}) {
  const { trackId, isPlaying, playPause } = useGlobalAudio();
  const title = getTrack(trackId)?.title ?? "Vibe Night";

  return (
    <div
      className={`flex items-center gap-2 rounded-2xl border border-gvc-gold/20 bg-[#121212]/92 shadow-[0_8px_32px_rgba(0,0,0,0.55)] backdrop-blur-md ${
        compact ? "px-2 py-1.5" : "px-2.5 py-2"
      } ${isPlaying && !reducedMotion ? "shadow-[0_0_24px_rgba(255,224,72,0.12)]" : ""}`}
    >
      <PlayerVisualizer playing={isPlaying} reducedMotion={reducedMotion} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-[10px] font-bold uppercase tracking-wide text-white/90">{title}</p>
        {!compact ? <p className="font-body text-[9px] text-white/40">Vibe Night soundtrack</p> : null}
      </div>
      <button
        type="button"
        onClick={playPause}
        className={`flex shrink-0 items-center justify-center rounded-xl bg-gvc-gold/15 text-gvc-gold transition hover:bg-gvc-gold/25 active:scale-95 ${
          compact ? "h-9 w-9" : "h-10 w-10"
        }`}
        aria-label={isPlaying ? "Pause music" : "Play music"}
      >
        {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
      </button>
      <button
        type="button"
        onClick={onExpand}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 text-white/55 transition hover:border-gvc-gold/30 hover:text-gvc-gold"
        aria-label="Expand music player"
      >
        <ChevronUp className="h-4 w-4" />
      </button>
    </div>
  );
}
