"use client";

import { playUiClick } from "@/lib/sounds";
import { GameModal } from "../GameModal";

export function GardenSettingsPanel({
  open,
  onClose,
  muted,
  onToggleMute,
}: {
  open: boolean;
  onClose: () => void;
  muted: boolean;
  onToggleMute: () => void;
}) {
  return (
    <GameModal open={open} onClose={onClose} title="Settings" muted={muted}>
      <button
        type="button"
        onClick={() => {
          playUiClick(muted);
          onToggleMute();
        }}
        className="w-full rounded-xl border border-white/12 bg-black/50 py-3 font-display text-xs font-bold uppercase text-white/80"
      >
        Sound: {muted ? "Off" : "On"}
      </button>
    </GameModal>
  );
}
