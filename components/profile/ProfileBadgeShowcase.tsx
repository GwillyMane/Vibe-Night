"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Lock } from "lucide-react";
import { PROFILE_CARD, PROFILE_TEXT_SHADOW } from "@/lib/profile/profileStyles";
import type { PinnedBadge, PublicProfile } from "@/lib/profile/types";
import { achievementByKey } from "@/lib/profile/catalog";
import { badgeImageUrl } from "@/lib/profile/profileUi";
import { rewardBadgeUrlForKey } from "@/lib/gvcRewardBadges";

function BadgeTile({
  badgeKey,
  featured,
  locked,
}: {
  badgeKey: string;
  featured?: boolean;
  locked?: boolean;
}) {
  const reduced = useReducedMotion();
  const ach = achievementByKey(badgeKey);
  const src = badgeImageUrl(badgeKey, rewardBadgeUrlForKey);

  return (
    <motion.div
      whileHover={reduced || locked ? undefined : { y: -3, scale: 1.02 }}
      className={`relative flex min-w-[96px] flex-col items-center p-3 transition-shadow ${
        locked
          ? `${PROFILE_CARD} opacity-50 grayscale`
          : featured
            ? `${PROFILE_CARD} border-gvc-gold/45 shadow-[0_0_20px_rgba(255,224,72,0.18)]`
            : PROFILE_CARD
      }`}
    >
      {featured && !locked ? (
        <span className="absolute -top-2 left-1/2 z-[1] -translate-x-1/2 rounded-full border border-gvc-gold/50 bg-[#141414] px-2 py-0.5 font-body text-[9px] font-semibold uppercase tracking-wide text-gvc-gold">
          Featured
        </span>
      ) : null}
      <div className="relative flex h-14 w-14 items-center justify-center">
        <Image src={src} alt="" width={56} height={56} className="h-14 w-14 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]" unoptimized />
        {locked ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Lock className="h-4 w-4 text-[#c4c4c4] drop-shadow-md" aria-hidden />
          </div>
        ) : null}
        {!locked && !reduced ? (
          <motion.div
            className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent"
            animate={{ x: ["-120%", "220%"] }}
            transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
          />
        ) : null}
      </div>
      <p
        className={`mt-2 line-clamp-2 text-center font-display text-[10px] font-bold uppercase leading-tight text-[#FFE048] ${PROFILE_TEXT_SHADOW}`}
      >
        {ach?.title ?? "Badge"}
      </p>
    </motion.div>
  );
}

export function ProfileBadgeShowcase({ profile }: { profile: PublicProfile }) {
  const pins: PinnedBadge[] = profile.pinnedBadges.length
    ? profile.pinnedBadges
    : profile.featuredBadgeKey
      ? [{ slot: 0, badgeKey: profile.featuredBadgeKey }]
      : [];

  return (
    <div className="flex gap-2.5 overflow-x-auto pb-0.5 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none]">
      {pins.map((p) => (
        <BadgeTile
          key={`${p.slot}-${p.badgeKey}`}
          badgeKey={p.badgeKey}
          featured={profile.featuredBadgeKey === p.badgeKey}
        />
      ))}
      {Array.from({ length: Math.max(0, 4 - pins.length) }).map((_, i) => (
        <div
          key={`empty-${i}`}
          className={`flex min-w-[96px] flex-col items-center justify-center border-dashed p-3 ${PROFILE_CARD}`}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-[#333] bg-[#0c0c0c]">
            <span className="font-body text-[10px] text-[#888]">Empty</span>
          </div>
        </div>
      ))}
    </div>
  );
}
