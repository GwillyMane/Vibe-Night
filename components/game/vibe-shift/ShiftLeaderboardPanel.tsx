"use client";

import { ArcadeLeaderboardPanel } from "@/components/arcade/ArcadeLeaderboardPanel";
import { SHIFT_GAME_ID, SHIFT_LEVEL_ID } from "@/lib/vibe-shift/shiftConfig";
import { shiftDailySeed } from "@/lib/vibe-shift/shiftClassic";

export function ShiftLeaderboardPanel({
  open,
  onClose,
  muted,
}: {
  open: boolean;
  onClose: () => void;
  muted: boolean;
}) {
  return (
    <ArcadeLeaderboardPanel
      open={open}
      onClose={onClose}
      muted={muted}
      title="Shift Leaders"
      gameId={SHIFT_GAME_ID}
      levelId={SHIFT_LEVEL_ID}
      dailySeed={shiftDailySeed()}
    />
  );
}
