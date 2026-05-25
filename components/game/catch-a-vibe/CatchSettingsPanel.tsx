"use client";

import { playUiClick } from "@/lib/sounds";
import { GameModal } from "../GameModal";

export function CatchSettingsPanel({
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
        className="w-full rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-left font-display text-xs font-bold uppercase text-white/75"
      >
        Sound: {muted ? "Off" : "On"}
      </button>
      <button
        type="button"
        onClick={() => {
          playUiClick(muted);
          onClose();
        }}
        className="mt-4 w-full rounded-xl border border-white/12 py-2 font-display text-xs font-bold uppercase text-white/60"
      >
        Close
      </button>
    </GameModal>
  );
}
