"use client";

import type { GardenPersisted } from "@/lib/vibe-garden/gardenStorage";
import { buildGardenBadgeRows, reconcileGardenAchievements } from "@/lib/vibe-garden/gardenAchievements";
import { BadgesPanel } from "@/components/arcade/BadgesPanel";
import { GameModal } from "../GameModal";

export function GardenBadgesPanel({
  open,
  onClose,
  muted,
  persisted,
}: {
  open: boolean;
  onClose: () => void;
  muted: boolean;
  persisted: GardenPersisted;
}) {
  const synced = reconcileGardenAchievements(persisted);
  return (
    <GameModal open={open} onClose={onClose} title="Badges" muted={muted} tall>
      <BadgesPanel rows={buildGardenBadgeRows(synced)} gameId="vibe-garden" />
    </GameModal>
  );
}

/** @deprecated Use GardenBadgesPanel */
export const GardenGoalsPanel = GardenBadgesPanel;
