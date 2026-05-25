"use client";

import { motion } from "framer-motion";
import toast from "react-hot-toast";
import Image from "next/image";
import type { GameId } from "@/lib/games/catalog";
import type { AchievementTier } from "@/lib/achievements";
import { achievementRewardBadgeUrl } from "@/lib/gvcRewardBadges";

const TIER_BORDER: Record<string, string> = {
  bronze: "rgba(255, 95, 31, 0.45)",
  silver: "rgba(200, 200, 210, 0.45)",
  gold: "rgba(255, 224, 72, 0.55)",
  cosmic: "rgba(255, 107, 157, 0.55)",
};

const TIER_GLOW: Record<string, string> = {
  bronze: "0 0 28px rgba(255, 95, 31, 0.35)",
  silver: "0 0 28px rgba(200, 200, 210, 0.25)",
  gold: "0 0 36px rgba(255, 224, 72, 0.45)",
  cosmic: "0 0 36px rgba(255, 107, 157, 0.4)",
};

export interface ToastAchievement {
  slug: string;
  title: string;
  description: string;
  tier: AchievementTier;
}

export function showAchievementToasts(unlocked: ToastAchievement[], gameId: GameId = "vibe-crashers") {
  for (const a of unlocked) {
    const border = TIER_BORDER[a.tier] ?? TIER_BORDER.bronze;
    const glow = TIER_GLOW[a.tier] ?? TIER_GLOW.bronze;
    const badgeSrc = achievementRewardBadgeUrl(a.slug, gameId);
    toast.custom(
      () => (
        <motion.div
          initial={{ x: 48, opacity: 0, scale: 0.94 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: 36, opacity: 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 28 }}
          className="pointer-events-auto flex max-w-sm gap-3 rounded-2xl border bg-gvc-dark/96 px-4 py-3 shadow-2xl backdrop-blur-md"
          style={{ borderColor: border, boxShadow: `${glow}, 0 18px 50px rgba(0,0,0,0.65)` }}
          role="status"
        >
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-gvc-gold/30 bg-black/50">
            <Image
              src={badgeSrc ?? "/shaka.png"}
              alt={a.title}
              fill
              className="object-cover p-0.5"
              sizes="48px"
              unoptimized={Boolean(badgeSrc)}
            />
          </div>
          <div className="min-w-0 text-left">
            <p className="font-display text-[10px] font-bold uppercase tracking-widest text-gvc-gold/85">Badge unlocked</p>
            <p className="font-display text-lg font-bold leading-tight text-white">{a.title}</p>
            <p className="mt-0.5 font-body text-sm text-white/60">{a.description}</p>
            <p className="mt-1.5 font-body text-[10px] uppercase tracking-widest text-white/35">{a.tier}</p>
          </div>
        </motion.div>
      ),
      { duration: 4200, id: `ach-${gameId}-${a.slug}` }
    );
  }
}
