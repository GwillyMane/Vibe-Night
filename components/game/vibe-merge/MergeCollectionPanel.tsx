"use client";

import { UnifiedAchievementPanel } from "@/components/arcade/UnifiedAchievementPanel";
import { MERGE_ACHIEVEMENTS } from "@/lib/vibe-merge/mergeAchievements";
import { MERGE_TIERS } from "@/lib/vibe-merge/mergeConfig";
import type { MergePersisted } from "@/lib/vibe-merge/mergeStorage";

export function MergeCollectionPanel({ persisted }: { persisted: MergePersisted }) {
  const unlocked = persisted.highestTierEver;
  const owned = new Set(persisted.achievements);

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 font-display text-[10px] font-bold uppercase tracking-widest text-white/45">Vibe tiers</p>
        <p className="mb-2 font-body text-xs text-white/50">Unlock higher tiers by merging in-game.</p>
        <ul className="grid grid-cols-2 gap-2">
          {MERGE_TIERS.map((t) => {
            const on = t.id <= unlocked;
            return (
              <li
                key={t.id}
                className={`rounded-xl border px-3 py-2 ${on ? "border-gvc-gold/25 bg-black/50" : "border-white/8 bg-black/30 opacity-50"}`}
              >
                <p className="font-display text-[10px] font-bold uppercase text-gvc-gold">{t.shortName}</p>
                <p className="font-body text-[10px] text-white/45">{on ? "Unlocked" : "Locked"}</p>
              </li>
            );
          })}
        </ul>
      </div>
      <div>
        <p className="mb-2 font-display text-[10px] font-bold uppercase tracking-widest text-white/45">Badges</p>
        <UnifiedAchievementPanel
          gameId="vibe-merge"
          achievements={MERGE_ACHIEVEMENTS.map((a) => ({
            slug: a.slug,
            title: a.title,
            description: a.description,
            tier: a.tier,
            unlocked: owned.has(a.slug),
          }))}
        />
      </div>
    </div>
  );
}
