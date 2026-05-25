"use client";

import { GameModal } from "../GameModal";

export function LuckySettingsPanel({
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
        onClick={onToggleMute}
        className="w-full rounded-xl border border-white/15 px-4 py-3 text-left font-body text-sm text-white/80"
      >
        Sound effects: {muted ? "Off" : "On"}
      </button>
    </GameModal>
  );
}
