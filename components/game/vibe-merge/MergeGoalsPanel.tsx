"use client";

import type { MergePersisted } from "@/lib/vibe-merge/mergeStorage";
import { buildMergeBadgeRows, reconcileMergeAchievements } from "@/lib/vibe-merge/mergeAchievements";
import { BadgesPanel } from "@/components/arcade/BadgesPanel";

export function MergeBadgesPanel({ persisted }: { persisted: MergePersisted }) {
  const synced = reconcileMergeAchievements(persisted);
  return <BadgesPanel rows={buildMergeBadgeRows(synced)} gameId="vibe-merge" />;
}

/** @deprecated Use MergeBadgesPanel */
export const MergeGoalsPanel = MergeBadgesPanel;
