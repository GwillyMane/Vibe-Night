"use client";

import type { ShiftPersisted } from "@/lib/vibe-shift/shiftStorage";
import { buildShiftBadgeRows, reconcileShiftAchievements } from "@/lib/vibe-shift/shiftAchievements";
import { BadgesPanel } from "@/components/arcade/BadgesPanel";
import { useMemo } from "react";

export function ShiftGoalsPanel({ persisted }: { persisted: ShiftPersisted }) {
  const synced = useMemo(() => reconcileShiftAchievements(persisted), [persisted]);
  return (
    <div className="space-y-4">
      <BadgesPanel rows={buildShiftBadgeRows(synced)} gameId="vibe-shift" />
    </div>
  );
}
