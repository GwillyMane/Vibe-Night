"use client";

import { UnifiedAchievementPanel } from "@/components/arcade/UnifiedAchievementPanel";
import { GARDEN_ACHIEVEMENTS } from "@/lib/vibe-garden/gardenAchievements";
import type { GardenPersisted } from "@/lib/vibe-garden/gardenStorage";
import { playUiClick } from "@/lib/sounds";
import { GameModal } from "../GameModal";

export function GardenCollectionPanel({
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
  const owned = new Set(persisted.achievements);

  return (
    <GameModal open={open} onClose={onClose} title="Collection" subtitle="Lifetime garden stats" muted={muted} tall>
      <UnifiedAchievementPanel
        gameId="vibe-garden"
        achievements={GARDEN_ACHIEVEMENTS.map((a) => ({
          slug: a.slug,
          title: a.title,
          description: a.description,
          tier: a.tier,
          unlocked: owned.has(a.slug),
        }))}
        statsBlock={
          <ul className="space-y-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-body text-xs text-white/55">
            <li>Total plants: {persisted.stats.totalPlants}</li>
            <li>Best bloom chain: {persisted.stats.maxBloomChain}×</li>
            <li>Corruption cleansed: {persisted.stats.cleanses}</li>
            <li>Golden blooms: {persisted.stats.goldBlooms}</li>
            <li>Runs completed: {persisted.stats.runs}</li>
          </ul>
        }
      />
      <button
        type="button"
        onClick={() => {
          playUiClick(muted);
          onClose();
        }}
        className="mt-4 w-full rounded-xl border border-white/12 py-2 font-display text-xs font-bold uppercase text-white/60"
      >
        Close
      </button>
    </GameModal>
  );
}
