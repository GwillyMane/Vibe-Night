"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Flame, Gamepad2, Sparkles } from "lucide-react";
import {
  profileAvatarGlowClass,
  profileBackgroundShowsEmbers,
  profileBorderClass,
  profileHeroShellClass,
  profileTitleClass,
  PROFILE_TEXT_SHADOW,
  titleRarityGlow,
} from "@/lib/profile/profileStyles";
import { avatarUrlForFaceId, badgeImageUrl, formatJoinDate } from "@/lib/profile/profileUi";
import type { PublicProfile } from "@/lib/profile/types";

function cx(...parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export interface ProfileHeroCoreProps {
  profile: PublicProfile;
  badgeSrc?: (key: string) => string | undefined;
  compact?: boolean;
  showMeta?: boolean;
  className?: string;
}

function HeroParticles({ reduced }: { reduced: boolean }) {
  if (reduced) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.span
          key={i}
          className="ember absolute h-1 w-1 rounded-full bg-gvc-gold/60"
          style={{ left: `${15 + i * 18}%`, bottom: `${10 + (i % 3) * 8}%` }}
          animate={{ y: [0, -24, 0], opacity: [0.2, 0.7, 0.2] }}
          transition={{ duration: 4 + i * 0.6, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
        />
      ))}
    </div>
  );
}

function AnimatedGlow({ reduced }: { reduced: boolean }) {
  if (reduced) {
    return <div className="pointer-events-none absolute -inset-px rounded-[inherit] bg-gvc-gold/5" aria-hidden />;
  }
  return (
    <motion.div
      className="pointer-events-none absolute -inset-8 rounded-[inherit] opacity-40 blur-3xl"
      style={{ background: "radial-gradient(circle at 50% 40%, rgba(255,224,72,0.25), transparent 65%)" }}
      animate={{ scale: [1, 1.05, 1], opacity: [0.25, 0.45, 0.25] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden
    />
  );
}

function FeaturedBadgeOverlay({
  badgeKey,
  badgeSrc,
  compact,
  reduced,
}: {
  badgeKey: string;
  badgeSrc?: (key: string) => string | undefined;
  compact: boolean;
  reduced: boolean;
}) {
  const src = badgeImageUrl(badgeKey, badgeSrc);

  return (
    <motion.div
      initial={reduced ? false : { scale: 0.75, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={reduced ? undefined : { scale: 0.75, opacity: 0 }}
      transition={{ type: "spring", stiffness: 520, damping: 28 }}
      className={cx(
        "absolute -bottom-1 -right-1",
        compact ? "h-8 w-8" : "h-10 w-10 sm:h-11 sm:w-11",
      )}
    >
      <img
        src={src}
        alt=""
        className="h-full w-full object-contain drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]"
      />
      {!reduced && (
        <motion.div
          className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent"
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
        />
      )}
    </motion.div>
  );
}

export function ProfileHeroCore({
  profile,
  badgeSrc,
  compact = false,
  showMeta = true,
  className,
}: ProfileHeroCoreProps) {
  const reduced = useReducedMotion();
  const avatarSize = compact ? 72 : 112;
  const showEmbers = profileBackgroundShowsEmbers(profile.backgroundId);

  return (
    <motion.section
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={cx(
        "relative overflow-hidden rounded-2xl border shadow-[0_12px_40px_rgba(0,0,0,0.55)]",
        profileHeroShellClass(profile.themeId),
        compact ? "p-4" : "p-5 sm:p-7",
        className,
      )}
    >
      <AnimatedGlow reduced={!!reduced} />
      {showEmbers && <HeroParticles reduced={!!reduced} />}

      <div className={cx("relative flex gap-4", compact ? "items-center" : "flex-col sm:flex-row sm:items-start sm:gap-6")}>
        <motion.div
          className="relative shrink-0"
          whileHover={reduced ? undefined : { scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
        >
          <div
            className={cx(
              "relative overflow-hidden rounded-2xl border-2 bg-[#121212]",
              profileBorderClass(profile.borderId),
              profileAvatarGlowClass(profile.glowId),
            )}
          >
            <Image
              src={avatarUrlForFaceId(profile.avatarFaceId)}
              alt=""
              width={avatarSize}
              height={avatarSize}
              className={cx("object-cover", compact ? "h-[72px] w-[72px]" : "h-24 w-24 sm:h-28 sm:w-28")}
              priority={!compact}
            />
          </div>
          <AnimatePresence mode="wait">
            {profile.featuredBadgeKey ? (
              <FeaturedBadgeOverlay
                key={profile.featuredBadgeKey}
                badgeKey={profile.featuredBadgeKey}
                badgeSrc={badgeSrc}
                compact={compact}
                reduced={!!reduced}
              />
            ) : null}
          </AnimatePresence>
        </motion.div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1
              className={cx(
                "font-display font-black uppercase tracking-wide text-white",
                PROFILE_TEXT_SHADOW,
                compact ? "text-lg" : "text-2xl sm:text-3xl",
              )}
            >
              {profile.username}
            </h1>
            <span
              className={cx(
                "rounded-full border bg-[#141414] px-2.5 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wider",
                profile.arcadeTier === "Rookie"
                  ? "border-[#444] text-[#d4d4d4]"
                  : profile.arcadeTier === "Regular"
                    ? "border-gvc-gold/45 text-gvc-gold"
                    : profile.arcadeTier === "Crusher"
                      ? "border-gvc-gold/55 text-gvc-gold"
                      : "border-pink-accent/50 text-shimmer",
              )}
            >
              {profile.arcadeTier}
            </span>
          </div>

          <p
            className={cx(
              "font-display font-bold",
              compact ? "text-sm" : "text-base sm:text-lg",
              profileTitleClass(profile.titleRarity),
              titleRarityGlow(profile.titleRarity),
              PROFILE_TEXT_SHADOW,
            )}
          >
            {profile.equippedTitleLabel}
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gvc-gold/45 bg-[#141414] px-2.5 py-1 font-body text-xs font-medium text-gvc-gold">
              <Flame className="h-3.5 w-3.5" aria-hidden />
              {profile.streak.currentStreak} day streak
            </span>
            {profile.favoriteGameLabel && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2a2a2a] bg-[#141414] px-2.5 py-1 font-body text-xs text-[#e8e8e8]">
                <Gamepad2 className="h-3.5 w-3.5" aria-hidden />
                {profile.favoriteGameLabel}
              </span>
            )}
            {!compact && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2a2a2a] bg-[#141414] px-2.5 py-1 font-body text-xs text-[#d4d4d4]">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Rank #{profile.vibeRank.toLocaleString()}
              </span>
            )}
          </div>

          {showMeta && !compact && (
            <p className={`font-body text-xs text-[#b3b3b3] ${PROFILE_TEXT_SHADOW}`}>
              Joined {formatJoinDate(profile.joinDate)}
              {profile.isActiveRecently && (
                <span className="ml-2 inline-flex items-center gap-1 text-gvc-green">
                  <span className="h-1.5 w-1.5 rounded-full bg-gvc-green animate-pulse" />
                  Active recently
                </span>
              )}
            </p>
          )}
        </div>
      </div>
    </motion.section>
  );
}
