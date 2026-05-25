"use client";

import { UnifiedAchievementPanel } from "@/components/arcade/UnifiedAchievementPanel";
import { CATCH_ACHIEVEMENTS } from "@/lib/catch-a-vibe/catchAchievements";
import type { CatchPersisted } from "@/lib/catch-a-vibe/catchStorage";
import { playUiClick } from "@/lib/sounds";
import { GameModal } from "../GameModal";

export function CatchCollectionPanel({
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
  const owned = new Set(persisted.achievements);

  return (
    <GameModal open={open} onClose={onClose} title="Collection" subtitle="Lifetime catch stats" muted={muted} tall>
      <UnifiedAchievementPanel
        gameId="catch-a-vibe"
        achievements={CATCH_ACHIEVEMENTS.map((a) => ({
          slug: a.slug,
          title: a.title,
          description: a.description,
          tier: a.tier,
          unlocked: owned.has(a.slug),
        }))}
        statsBlock={
          <ul className="space-y-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-body text-xs text-white/55">
            <li>Total catches: {persisted.stats.totalCatches}</li>
            <li>Best combo: ×{persisted.stats.maxCombo}</li>
            <li>Best bloom chain run: {persisted.stats.maxBloomChain}</li>
            <li>Bad vibes dodged: {persisted.stats.badDodged}</li>
            <li>Golden catches: {persisted.stats.goldenCatches}</li>
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
