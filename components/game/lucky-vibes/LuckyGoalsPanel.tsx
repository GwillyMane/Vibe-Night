"use client";

import { useMemo } from "react";
import { BadgesPanel } from "@/components/arcade/BadgesPanel";
import { buildLuckyBadgeRows, reconcileLuckyAchievements } from "@/lib/lucky-vibes/luckyAchievements";
import type { LuckyPersisted } from "@/lib/lucky-vibes/luckyStorage";

export function LuckyGoalsPanel({ persisted }: { persisted: LuckyPersisted }) {
  const synced = useMemo(() => reconcileLuckyAchievements(persisted), [persisted]);
  return (
    <div className="space-y-4">
      <BadgesPanel rows={buildLuckyBadgeRows(synced)} gameId="lucky-vibes" />
    </div>
  );
}
