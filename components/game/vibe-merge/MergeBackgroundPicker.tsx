"use client";

import { MERGE_BACKGROUNDS } from "@/lib/vibe-merge/mergeBackgrounds";
import { playUiClick } from "@/lib/sounds";

export function MergeBackgroundPicker({
  selectedId,
  muted,
  onSelect,
}: {
  selectedId: string;
  muted: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="font-display text-[10px] font-bold uppercase tracking-widest text-white/65">Play area background</p>
      <div className="grid grid-cols-2 gap-2">
        {MERGE_BACKGROUNDS.map((bg) => {
          const on = bg.id === selectedId;
          return (
            <button
              key={bg.id}
              type="button"
              onClick={() => {
                playUiClick(muted);
                onSelect(bg.id);
              }}
              className={`relative overflow-hidden rounded-xl border text-left transition ${
                on
                  ? "border-gvc-gold ring-2 ring-gvc-gold/40"
                  : "border-white/10 hover:border-gvc-gold/35"
              }`}
            >
              <div className="relative aspect-[5/4] w-full overflow-hidden bg-black/60">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={bg.src} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              </div>
              <span className="absolute bottom-1.5 left-2 font-display text-[9px] font-bold uppercase tracking-wide text-gvc-gold">
                {bg.label}
              </span>
              {on ? (
                <span className="absolute right-1.5 top-1.5 rounded bg-gvc-gold px-1.5 py-0.5 font-display text-[8px] font-black uppercase text-gvc-black">
                  On
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
