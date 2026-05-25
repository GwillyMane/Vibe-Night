"use client";

import type { ReactNode } from "react";
import { Check, Lock } from "lucide-react";
import type { GameId } from "@/lib/games/catalog";
import type { BadgeRow } from "@/lib/arcade/badgeTypes";
import { achievementRewardBadgeUrl } from "@/lib/gvcRewardBadges";
import { RewardBadgeThumb } from "@/components/game/RewardBadgeThumb";

const TIER_LABEL: Record<string, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  cosmic: "Cosmic",
};

const TIER_CHIP: Record<string, string> = {
  bronze: "border-orange-500/30 bg-orange-500/10 text-orange-300/90",
  silver: "border-gray-300/25 bg-gray-300/10 text-gray-200/85",
  gold: "border-gvc-gold/35 bg-gvc-gold/10 text-gvc-gold",
  cosmic: "border-pink-accent/35 bg-pink-accent/10 text-pink-accent",
};

function BadgeCard({ badge, gameId }: { badge: BadgeRow; gameId: GameId }) {
  const pct = Math.min(100, Math.round((badge.current / Math.max(badge.target, 1)) * 100));
  const badgeSrc = achievementRewardBadgeUrl(badge.slug, gameId);

  return (
    <article
      className={`flex h-full flex-col rounded-2xl border p-3.5 transition ${
        badge.unlocked
          ? "border-gvc-gold/30 bg-[#141414] shadow-[0_0_18px_rgba(255,224,72,0.1)]"
          : "border-white/[0.08] bg-[#0c0c0c]"
      }`}
    >
      <div className="relative mx-auto flex h-[5.5rem] w-[5.5rem] items-center justify-center">
        <RewardBadgeThumb
          src={badgeSrc}
          alt={badge.title}
          size={88}
          glow={badge.unlocked ? "gold" : "soft"}
          className={badge.unlocked ? "" : "opacity-45 grayscale"}
        />
        {!badge.unlocked ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <Lock className="h-5 w-5 text-white/35 drop-shadow-md" aria-hidden />
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex min-h-0 flex-1 flex-col text-center">
        <p className="font-display text-sm font-black uppercase leading-snug tracking-wide text-gvc-gold">{badge.title}</p>
        <p className="mt-1.5 line-clamp-3 font-body text-xs leading-relaxed text-white/60">{badge.description}</p>

        <div className="mt-auto pt-3">
          <span
            className={`inline-flex rounded-full border px-2.5 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wider ${
              TIER_CHIP[badge.tier] ?? TIER_CHIP.bronze
            }`}
          >
            {TIER_LABEL[badge.tier] ?? badge.tier}
          </span>

          {badge.unlocked ? (
            <p className="mt-2 flex items-center justify-center gap-1 font-body text-[11px] font-medium text-gvc-green">
              <Check className="h-3.5 w-3.5" aria-hidden />
              Unlocked
            </p>
          ) : (
            <div className="mt-2.5 space-y-1.5">
              <div className="flex items-center justify-between font-body text-[10px] text-white/40">
                <span>Progress</span>
                <span>
                  {badge.current}/{badge.target}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-black/60">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-gvc-orange/80 to-gvc-gold transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function BadgeGrid({ rows, gameId }: { rows: BadgeRow[]; gameId: GameId }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {rows.map((b) => (
        <BadgeCard key={b.slug} badge={b} gameId={gameId} />
      ))}
    </div>
  );
}

export function BadgesPanel({
  rows,
  gameId,
  footer,
}: {
  rows: BadgeRow[];
  gameId: GameId;
  footer?: ReactNode;
}) {
  const unlocked = rows.filter((r) => r.unlocked);
  const locked = rows.filter((r) => !r.unlocked);

  return (
    <div className="space-y-4 pb-2">
      <p className="font-body text-xs leading-relaxed text-white/45">
        {unlocked.length}/{rows.length} badges unlocked — each pairs with an official{" "}
        <a
          href="https://goodvibesclub.ai/library"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gvc-gold/90 underline decoration-gvc-gold/30 underline-offset-2 hover:text-gvc-gold"
        >
          GVC library badge
        </a>
        . Progress saves in this browser.
      </p>

      {unlocked.length > 0 ? (
        <section>
          <p className="mb-2.5 font-body text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">
            Unlocked · {unlocked.length}
          </p>
          <BadgeGrid rows={unlocked} gameId={gameId} />
        </section>
      ) : null}

      {locked.length > 0 ? (
        <section>
          <p className="mb-2.5 font-body text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
            Locked · {locked.length}
          </p>
          <BadgeGrid rows={locked} gameId={gameId} />
        </section>
      ) : null}

      {footer}
    </div>
  );
}
