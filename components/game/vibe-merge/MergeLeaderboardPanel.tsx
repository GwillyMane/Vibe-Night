"use client";

import { ArcadeLeaderboardPanel } from "@/components/arcade/ArcadeLeaderboardPanel";
import { MERGE_GAME_ID, MERGE_LEVEL_ID } from "@/lib/vibe-merge/mergeConfig";
import { mergeDailySeed } from "@/lib/vibe-merge/mergeDaily";

export function MergeLeaderboardPanel({
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
      title="Big Vibes Leaders"
      gameId={MERGE_GAME_ID}
      levelId={MERGE_LEVEL_ID}
      dailySeed={mergeDailySeed()}
    />
  );
}
