"use client";

import { GVC_COLOR_ACCENT, GVC_COLOR_LABELS } from "@/lib/assets/gvcLibraryFaces";
import { playUiClick } from "@/lib/sounds";
import type { GardenColorId } from "@/lib/vibe-garden/gardenConfig";

export function GardenZenPalette({
  selected,
  onSelect,
  muted,
}: {
  selected: GardenColorId;
  onSelect: (c: GardenColorId) => void;
  muted: boolean;
}) {
  const colors = [0, 1, 2, 3, 4, 5] as const;
  return (
    <div
      className="pointer-events-auto absolute z-20 flex flex-col gap-1.5 rounded-2xl border border-gvc-gold/25 bg-black/75 p-2 shadow-lg backdrop-blur-md"
      style={{
        top: "max(3.5rem, calc(env(safe-area-inset-top) + 2.75rem))",
        right: "max(0.5rem, env(safe-area-inset-right))",
      }}
    >
      <p className="px-0.5 text-center font-display text-[7px] font-bold uppercase tracking-widest text-white/40">
        Color
      </p>
      {colors.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => {
            playUiClick(muted);
            onSelect(c);
          }}
          className={`h-9 w-9 rounded-full border-2 transition-transform sm:h-10 sm:w-10 ${
            selected === c ? "scale-105 border-gvc-gold ring-2 ring-gvc-gold/35" : "border-white/15 hover:border-white/30"
          }`}
          style={{ backgroundColor: GVC_COLOR_ACCENT[c] + "55" }}
          title={GVC_COLOR_LABELS[c]}
          aria-label={GVC_COLOR_LABELS[c]}
          aria-pressed={selected === c}
        />
      ))}
    </div>
  );
}
