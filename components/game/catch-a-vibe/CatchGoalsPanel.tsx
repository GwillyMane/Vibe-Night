"use client";

import type { CatchPersisted } from "@/lib/catch-a-vibe/catchStorage";
import { buildCatchBadgeRows, reconcileCatchAchievements } from "@/lib/catch-a-vibe/catchAchievements";
import { BadgesPanel } from "@/components/arcade/BadgesPanel";
import { GameModal } from "../GameModal";

export function CatchBadgesPanel({
  open,
  onClose,
  muted,
  persisted,
}: {
  open: boolean;
  onClose: () => void;
  muted: boolean;
  persisted: CatchPersisted;
}) {
  const synced = reconcileCatchAchievements(persisted);
  return (
    <GameModal open={open} onClose={onClose} title="Badges" muted={muted} tall>
      <BadgesPanel rows={buildCatchBadgeRows(synced)} gameId="catch-a-vibe" />
    </GameModal>
  );
}

/** @deprecated Use CatchBadgesPanel */
export const CatchGoalsPanel = CatchBadgesPanel;
