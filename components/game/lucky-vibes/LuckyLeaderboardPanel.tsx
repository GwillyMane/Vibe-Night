"use client";

import { ArcadeLeaderboardPanel } from "@/components/arcade/ArcadeLeaderboardPanel";
import { LUCKY_GAME_ID, LUCKY_LEVEL_ID } from "@/lib/lucky-vibes/luckyConfig";

export function LuckyLeaderboardPanel({
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
      title="Lucky Vibes Leaders"
      gameId={LUCKY_GAME_ID}
      levelId={LUCKY_LEVEL_ID}
    />
  );
}
