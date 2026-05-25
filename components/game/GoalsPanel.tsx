"use client";

import { buildCrashersBadgeRows, reconcileCrashersAchievements } from "@/lib/achievements";
import { loadPersisted } from "@/lib/storage";
import { BadgesPanel } from "@/components/arcade/BadgesPanel";

export function CrashersBadgesPanel() {
  const p = reconcileCrashersAchievements(loadPersisted());
  return <BadgesPanel rows={buildCrashersBadgeRows(p)} gameId="vibe-crashers" />;
}

/** @deprecated Use CrashersBadgesPanel */
export const GoalsPanel = CrashersBadgesPanel;
