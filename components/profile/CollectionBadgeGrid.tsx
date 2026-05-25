"use client";

import { useMemo } from "react";
import Image from "next/image";
import { Lock } from "lucide-react";
import type { CollectionItem } from "@/lib/profile/types";
import { rewardBadgeUrlForKey, REWARD_BADGE_FALLBACK_SRC } from "@/lib/gvcRewardBadges";
import { GAME_LIBRARY, type GameId } from "@/lib/games/catalog";

const TIER_CHIP: Record<string, string> = {
  bronze: "border-orange-500/30 bg-orange-500/10 text-orange-300/90",
  silver: "border-gray-300/25 bg-gray-300/8 text-gray-200/80",
  gold: "border-gvc-gold/35 bg-gvc-gold/10 text-gvc-gold",
  cosmic: "border-pink-accent/35 bg-pink-accent/10 text-pink-accent",
};

function BadgeTile({ badge, readOnly }: { badge: CollectionItem; readOnly?: boolean }) {
  const src = badge.imageUrl ?? rewardBadgeUrlForKey(badge.id) ?? REWARD_BADGE_FALLBACK_SRC;
  const gameLabel = GAME_LIBRARY.find((g) => g.id === badge.gameId)?.shortTitle;

  return (
    <div
      className={`relative flex flex-col rounded-xl border p-2.5 transition ${
        badge.unlocked
          ? "border-[#2a2a2a] bg-[#141414] shadow-[0_2px_12px_rgba(0,0,0,0.35)]"
          : "border-[#222] bg-[#0c0c0c] opacity-50 grayscale"
      }`}
    >
      <div className="relative mx-auto flex h-16 w-16 items-center justify-center">
        <Image src={src} alt={badge.label} width={64} height={64} className="h-16 w-16 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]" unoptimized />
        {!badge.unlocked ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Lock className="h-4 w-4 text-[#888] drop-shadow-md" aria-hidden />
          </div>
        ) : null}
      </div>
      <p className="mt-2 line-clamp-2 min-h-[2.25rem] text-center font-display text-[9px] font-bold uppercase leading-tight text-[#efefef]">
        {badge.label}
      </p>
      {badge.tier ? (
        <span
          className={`mx-auto mt-1.5 rounded-full border px-2 py-0.5 font-body text-[8px] uppercase tracking-wider ${
            TIER_CHIP[badge.tier] ?? TIER_CHIP.bronze
          }`}
        >
          {badge.tier}
        </span>
      ) : null}
      {!readOnly && gameLabel ? (
        <p className="mt-1 text-center font-body text-[8px] text-[#666]">{gameLabel}</p>
      ) : null}
    </div>
  );
}

export function CollectionBadgeGrid({
  badges,
  gameFilter = "all",
  readOnly = true,
}: {
  badges: CollectionItem[];
  gameFilter?: GameId | "all";
  readOnly?: boolean;
}) {
  const filtered = useMemo(() => {
    const list =
      gameFilter === "all" ? badges : badges.filter((b) => b.gameId === gameFilter);
    return [...list].sort((a, b) => {
      if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
      return a.label.localeCompare(b.label);
    });
  }, [badges, gameFilter]);

  const unlocked = filtered.filter((b) => b.unlocked);
  const locked = filtered.filter((b) => !b.unlocked);

  if (!filtered.length) {
    return (
      <p className="rounded-xl border border-[#2a2a2a] bg-[#141414] px-4 py-8 text-center font-body text-sm text-[#888]">
        No badges in this category yet.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {unlocked.length > 0 ? (
        <div>
          <p className="mb-2.5 font-body text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9e9e9e]">
            Unlocked · {unlocked.length}
          </p>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">{unlocked.map((b) => (
            <BadgeTile key={b.id} badge={b} readOnly={readOnly} />
          ))}</div>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-[#2a2a2a] bg-[#0c0c0c] px-4 py-6 text-center font-body text-xs text-[#888]">
          No unlocked badges in this filter — keep playing to earn GVC library badges.
        </p>
      )}
      {locked.length > 0 ? (
        <div>
          <p className="mb-2.5 font-body text-[10px] font-semibold uppercase tracking-[0.16em] text-[#666]">
            Locked · {locked.length}
          </p>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">{locked.map((b) => (
            <BadgeTile key={b.id} badge={b} readOnly={readOnly} />
          ))}</div>
        </div>
      ) : null}
    </div>
  );
}
