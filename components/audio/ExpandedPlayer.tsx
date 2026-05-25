"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, SkipBack, SkipForward, X } from "lucide-react";
import { useGlobalAudio } from "@/contexts/GlobalAudioContext";
import { getTrack } from "@/lib/audio/soundtrack";
import {
  arcadeBackdropClass,
  arcadeCloseBtnClass,
  arcadePanelClass,
  arcadeTitleClass,
} from "@/components/game/gamePanelStyles";
import { TrackSwitcher } from "./TrackSwitcher";
import { VolumeControl } from "./VolumeControl";
import { PlayerVisualizer } from "./PlayerVisualizer";

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function ExpandedPlayer({
  open,
  reducedMotion,
  onClose,
}: {
  open: boolean;
  reducedMotion: boolean;
  onClose: () => void;
}) {
  const {
    trackId,
    tracks,
    isPlaying,
    volume,
    muted,
    progressSec,
    durationSec,
    playPause,
    next,
    prev,
    selectTrack,
    setVolume,
    toggleMute,
    seek,
  } = useGlobalAudio();

  const track = getTrack(trackId);
  const pct = durationSec > 0 ? Math.min(100, (progressSec / durationSec) * 100) : 0;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className={`${arcadeBackdropClass} !z-[95] pointer-events-auto`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-label="Vibe Night soundtrack"
            className={`${arcadePanelClass} !max-w-sm`}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3 border-b border-white/[0.06] pb-3">
              <div>
                <p className="font-display text-[9px] font-bold uppercase tracking-[0.25em] text-white/40">
                  Vibe Night
                </p>
                <h2 className={arcadeTitleClass}>Soundtrack</h2>
              </div>
              <button type="button" onClick={onClose} className={arcadeCloseBtnClass} aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-2xl border border-gvc-gold/20 bg-black/50 px-4 py-4">
              <div className="flex items-center gap-3">
                <PlayerVisualizer playing={isPlaying} reducedMotion={reducedMotion} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-black uppercase text-gvc-gold">
                    {track?.title ?? "—"}
                  </p>
                  <p className="font-body text-xs text-white/45">{track?.mood ?? "Arcade ambient"}</p>
                </div>
              </div>

              {durationSec > 0 ? (
                <div className="mt-4">
                  <input
                    type="range"
                    min={0}
                    max={durationSec}
                    step={0.5}
                    value={progressSec}
                    onChange={(e) => seek(Number(e.target.value))}
                    className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-gvc-gold"
                    aria-label="Track progress"
                  />
                  <div className="mt-1 flex justify-between font-body text-[10px] tabular-nums text-white/40">
                    <span>{formatTime(progressSec)}</span>
                    <span>{formatTime(durationSec)}</span>
                  </div>
                  <div
                    className="pointer-events-none -mt-[9px] h-1 w-full overflow-hidden rounded-full bg-transparent"
                    aria-hidden
                  >
                    <div className="h-full rounded-full bg-gvc-gold/30" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ) : null}

              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={prev}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 text-white/70 transition hover:border-gvc-gold/35 hover:text-gvc-gold"
                  aria-label="Previous track"
                >
                  <SkipBack className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={playPause}
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gvc-gold font-display text-xs font-black uppercase text-gvc-black shadow-[0_0_28px_rgba(255,224,72,0.35)] transition active:scale-95"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? "Pause" : "Play"}
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 text-white/70 transition hover:border-gvc-gold/35 hover:text-gvc-gold"
                  aria-label="Next track"
                >
                  <SkipForward className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-4">
              <VolumeControl volume={volume} muted={muted} onVolume={setVolume} onToggleMute={toggleMute} />
            </div>

            <div className="mt-4">
              <p className="mb-2 font-display text-[10px] font-bold uppercase tracking-wider text-white/40">
                Curated tracks
              </p>
              <TrackSwitcher tracks={tracks} activeId={trackId} onSelect={selectTrack} />
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-4 flex w-full items-center justify-center gap-1 rounded-xl border border-white/10 py-2.5 font-display text-[10px] font-bold uppercase text-white/55 transition hover:border-gvc-gold/30 hover:text-gvc-gold"
            >
              <ChevronDown className="h-3.5 w-3.5" />
              Minimize
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
