"use client";

import type { ReactNode } from "react";
import { Check, Lock } from "lucide-react";
import type { GameId } from "@/lib/games/catalog";
import { achievementRewardBadgeUrl } from "@/lib/gvcRewardBadges";
import { RewardBadgeThumb } from "@/components/game/RewardBadgeThumb";

export type ArcadeAchievementTier = "bronze" | "silver" | "gold" | "cosmic";

export interface ArcadeAchievementRow {
  slug: string;
  title: string;
  description: string;
  tier: ArcadeAchievementTier;
  unlocked: boolean;
  gameId?: GameId;
}

const TIER_LABEL: Record<ArcadeAchievementTier, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  cosmic: "Cosmic",
};

const TIER_CHIP: Record<ArcadeAchievementTier, string> = {
  bronze: "border-orange-500/30 bg-orange-500/10 text-orange-300/90",
  silver: "border-gray-300/25 bg-gray-300/10 text-gray-200/85",
  gold: "border-gvc-gold/35 bg-gvc-gold/10 text-gvc-gold",
  cosmic: "border-pink-accent/35 bg-pink-accent/10 text-pink-accent",
};

function AchievementCard({
  achievement,
  badgeSrc,
}: {
  achievement: ArcadeAchievementRow;
  badgeSrc: string | undefined;
}) {
  return (
    <article
      className={`flex h-full flex-col rounded-2xl border p-3.5 transition ${
        achievement.unlocked
          ? "border-gvc-gold/30 bg-[#141414] shadow-[0_0_18px_rgba(255,224,72,0.1)]"
          : "border-white/[0.08] bg-[#0c0c0c]"
      }`}
    >
      <div className="relative mx-auto flex h-[5.5rem] w-[5.5rem] items-center justify-center">
        <RewardBadgeThumb
          src={badgeSrc}
          alt={achievement.title}
          size={88}
          glow={achievement.unlocked ? "gold" : "soft"}
          className={achievement.unlocked ? "" : "opacity-45 grayscale"}
        />
        {!achievement.unlocked ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <Lock className="h-5 w-5 text-white/35 drop-shadow-md" aria-hidden />
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex min-h-0 flex-1 flex-col text-center">
        <p className="font-display text-sm font-black uppercase leading-snug tracking-wide text-gvc-gold">
          {achievement.title}
        </p>
        <p className="mt-1.5 line-clamp-3 font-body text-xs leading-relaxed text-white/60">
          {achievement.description}
        </p>

        <div className="mt-auto pt-3">
          <span
            className={`inline-flex rounded-full border px-2.5 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wider ${
              TIER_CHIP[achievement.tier]
            }`}
          >
            {TIER_LABEL[achievement.tier]}
          </span>
          {achievement.unlocked ? (
            <p className="mt-2 flex items-center justify-center gap-1 font-body text-[11px] font-medium text-gvc-green">
              <Check className="h-3.5 w-3.5" aria-hidden />
              Unlocked
            </p>
          ) : (
            <p className="mt-2 font-body text-[11px] text-white/35">Locked</p>
          )}
        </div>
      </div>
    </article>
  );
}

export function UnifiedAchievementPanel({
  achievements,
  gameId = "vibe-crashers",
  statsBlock,
  footer,
}: {
  achievements: ArcadeAchievementRow[];
  gameId?: GameId;
  statsBlock?: ReactNode;
  footer?: ReactNode;
}) {
  const unlocked = achievements.filter((a) => a.unlocked);
  const locked = achievements.filter((a) => !a.unlocked);

  const renderGrid = (rows: ArcadeAchievementRow[]) => (
    <div className="grid grid-cols-2 gap-3">
      {rows.map((a) => {
        const gid = a.gameId ?? gameId;
        return (
          <AchievementCard
            key={a.slug}
            achievement={a}
            badgeSrc={achievementRewardBadgeUrl(a.slug, gid)}
          />
        );
      })}
    </div>
  );

  return (
    <div className="space-y-4">
      <p className="font-body text-xs text-white/50">
        {unlocked.length}/{achievements.length} badges unlocked
      </p>
      {statsBlock}

      {unlocked.length > 0 ? (
        <section>
          <p className="mb-2.5 font-body text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">
            Unlocked · {unlocked.length}
          </p>
          {renderGrid(unlocked)}
        </section>
      ) : null}

      {locked.length > 0 ? (
        <section>
          <p className="mb-2.5 font-body text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
            Locked · {locked.length}
          </p>
          {renderGrid(locked)}
        </section>
      ) : null}

      {footer}
    </div>
  );
}
