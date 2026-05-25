"use client";

import { ArcadeLeaderboardPanel } from "@/components/arcade/ArcadeLeaderboardPanel";
import { GARDEN_GAME_ID, GARDEN_LEVEL_ID } from "@/lib/vibe-garden/gardenConfig";
import { gardenDailySeed } from "@/lib/vibe-garden/gardenDaily";

export function GardenLeaderboardPanel({
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
      title="Garden Leaders"
      gameId={GARDEN_GAME_ID}
      levelId={GARDEN_LEVEL_ID}
      dailySeed={gardenDailySeed()}
    />
  );
}
