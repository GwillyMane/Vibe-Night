"use client";

import { ArcadeLeaderboardPanel } from "@/components/arcade/ArcadeLeaderboardPanel";
import { CATCH_GAME_ID, CATCH_LEVEL_ID } from "@/lib/catch-a-vibe/catchConfig";
import { catchDailySeed } from "@/lib/catch-a-vibe/catchDaily";

export function CatchLeaderboardPanel({
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
      title="Catch Leaders"
      gameId={CATCH_GAME_ID}
      levelId={CATCH_LEVEL_ID}
      dailySeed={catchDailySeed()}
    />
  );
}
