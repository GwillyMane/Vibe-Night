"use client";

import type { SoundtrackTrack } from "@/lib/audio/soundtrack";

export function TrackSwitcher({
  tracks,
  activeId,
  onSelect,
}: {
  tracks: readonly SoundtrackTrack[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <ul className="space-y-1">
      {tracks.map((t) => {
        const active = t.id === activeId;
        return (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => onSelect(t.id)}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition ${
                active
                  ? "border border-gvc-gold/35 bg-gvc-gold/10 text-gvc-gold"
                  : "border border-transparent text-white/65 hover:border-white/10 hover:bg-white/[0.03] hover:text-white/85"
              }`}
            >
              <span className="font-display text-xs font-bold uppercase tracking-wide">{t.title}</span>
              <span className="font-body text-[10px] text-white/40">{t.mood}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
