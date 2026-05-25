"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { animate, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { ArrowRight, Copy, RotateCcw, Share2, Trophy } from "lucide-react";
import type { GameId } from "@/lib/games/catalog";
import { achievementBySlug } from "@/lib/achievements";
import { achievementRewardBadgeUrl } from "@/lib/gvcRewardBadges";
import { playUiClick } from "@/lib/sounds";
import { RewardBadgeThumb } from "@/components/game/RewardBadgeThumb";

export interface ArcadeResultStat {
  label: string;
  value: ReactNode;
  /** Animate counting up to numeric score */
  animateValue?: number;
  highlight?: boolean;
  colSpan?: 1 | 2;
}

export interface ArcadeResultDetail {
  label: string;
  value: ReactNode;
}

export interface ArcadeResultShellProps {
  muted: boolean;
  modeLabel: string;
  contextLabel?: string;
  title: string;
  subtitle?: ReactNode;
  titleClassName?: string;
  stats: ArcadeResultStat[];
  detailItems?: ArcadeResultDetail[];
  stars?: number;
  isNewBest?: boolean;
  isLoggedIn?: boolean;
  serverRank?: number | null;
  onOpenAuth?: () => void;
  showSignIn?: boolean;
  newAchievementSlugs?: string[];
  badgeGameId?: GameId;
  children?: ReactNode;
  onRetry: () => void;
  retryLabel?: string;
  onNext?: () => void;
  showNext?: boolean;
  onShare?: () => void;
  onCopy?: () => void;
  copyLabel?: string;
  onOpenLeaderboard?: () => void;
  onMenu?: () => void;
  menuLabel?: string;
}

export function ArcadeResultShell({
  muted,
  modeLabel,
  contextLabel,
  title,
  subtitle,
  titleClassName = "text-shimmer",
  stats,
  detailItems,
  stars,
  isNewBest,
  isLoggedIn,
  serverRank,
  onOpenAuth,
  showSignIn,
  newAchievementSlugs,
  badgeGameId = "vibe-crashers",
  children,
  onRetry,
  retryLabel = "Retry",
  onNext,
  showNext,
  onShare,
  onCopy,
  copyLabel = "Copy score",
  onOpenLeaderboard,
  onMenu,
  menuLabel = "Menu",
}: ArcadeResultShellProps) {
  const c = () => playUiClick(muted);
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/80 p-0 backdrop-blur-md sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="arcade-result-title"
    >
      <motion.div
        initial={{ y: 48, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 32, opacity: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        className="relative w-full max-w-lg rounded-t-3xl border border-gvc-gold/20 border-b-0 bg-gvc-dark/97 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-8 shadow-[0_-24px_80px_rgba(0,0,0,0.75)] card-glow sm:rounded-3xl sm:border-b sm:pb-8"
      >
        <ResultHeader modeLabel={modeLabel} contextLabel={contextLabel} title={title} subtitle={subtitle} titleClassName={titleClassName} />

        {stars != null ? <StarRow stars={stars} reduceMotion={!!reduceMotion} /> : null}

        <StatsGrid stats={stats} reduceMotion={!!reduceMotion} />

        {isNewBest ? (
          <p className="mt-4 text-center font-display text-xs font-bold uppercase tracking-widest text-gvc-green">New best!</p>
        ) : null}

        {detailItems && detailItems.length > 0 ? (
          <ul className="mt-4 space-y-1 rounded-xl border border-white/[0.06] bg-black/45 px-3 py-2 text-left font-body text-xs text-white/55">
            {detailItems.map((item) => (
              <li key={item.label}>
                {item.label}: {item.value}
              </li>
            ))}
          </ul>
        ) : null}

        {children}

        {isLoggedIn && serverRank != null ? (
          <div className="mt-4 rounded-xl border border-gvc-gold/30 bg-gvc-gold/[0.08] px-3 py-2 text-center">
            <p className="font-display text-xs font-bold uppercase tracking-widest text-gvc-gold">Leaderboard</p>
            <p className="mt-1 font-display text-lg font-black text-white">Rank #{serverRank}</p>
          </div>
        ) : null}

        {showSignIn && !isLoggedIn ? (
          <div className="mt-4 rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-center">
            <p className="font-body text-sm text-white/65">Sign in to submit this score to the real leaderboard.</p>
            <button
              type="button"
              onClick={() => {
                c();
                onOpenAuth?.();
              }}
              className="mt-3 min-h-[44px] w-full rounded-xl bg-gvc-gold px-4 py-2 font-display text-xs font-black uppercase text-gvc-black"
            >
              Sign in
            </button>
          </div>
        ) : null}

        {newAchievementSlugs && newAchievementSlugs.length > 0 ? (
          <div className="mt-4 rounded-xl border border-gvc-gold/25 bg-black/40 px-3 py-3 text-left">
            <p className="font-display text-[10px] font-bold uppercase tracking-widest text-gvc-gold">Badges unlocked</p>
            <ul className="mt-2 space-y-2">
              {newAchievementSlugs.map((slug) => {
                const def = achievementBySlug(slug);
                const badgeTitle = def?.title ?? slug;
                return (
                  <li key={slug} className="flex items-center gap-3">
                    <RewardBadgeThumb src={achievementRewardBadgeUrl(slug, badgeGameId)} alt={badgeTitle} size={44} />
                    <span className="font-body text-xs text-white/75">{badgeTitle}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        <div className="mt-8 flex flex-col gap-2">
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                c();
                onRetry();
              }}
              className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-3 font-display text-sm font-bold uppercase tracking-wide text-white hover:border-gvc-gold/40"
            >
              <RotateCcw className="h-4 w-4" />
              {retryLabel}
            </button>
            {showNext && onNext ? (
              <button
                type="button"
                onClick={() => {
                  c();
                  onNext();
                }}
                className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-gvc-gold px-4 py-3 font-display text-sm font-black uppercase tracking-wide text-gvc-black hover:shadow-[0_0_24px_rgba(255,224,72,0.4)]"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {onShare ? (
              <button
                type="button"
                onClick={() => {
                  c();
                  onShare();
                }}
                className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl border border-gvc-gold/35 px-4 py-3 font-display text-sm font-bold uppercase tracking-wide text-gvc-gold hover:border-gvc-gold/60"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
            ) : null}
            {onCopy ? (
              <button
                type="button"
                onClick={() => {
                  c();
                  onCopy();
                }}
                className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl border border-white/12 px-4 py-3 font-display text-sm font-bold uppercase tracking-wide text-white/85 hover:border-gvc-gold/35"
              >
                <Copy className="h-4 w-4" />
                {copyLabel}
              </button>
            ) : null}
            {onOpenLeaderboard ? (
              <button
                type="button"
                onClick={() => {
                  c();
                  onOpenLeaderboard();
                }}
                className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl border border-white/12 px-4 py-3 font-display text-sm font-bold uppercase tracking-wide text-white/85 hover:border-gvc-gold/35"
              >
                <Trophy className="h-4 w-4" />
                Leaders
              </button>
            ) : null}
            {onMenu ? (
              <button
                type="button"
                onClick={() => {
                  c();
                  onMenu();
                }}
                className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl border border-white/12 px-4 py-3 font-display text-sm font-bold uppercase tracking-wide text-white/55 hover:border-white/25 hover:text-white/75"
              >
                {menuLabel}
              </button>
            ) : null}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ResultHeader({
  modeLabel,
  contextLabel,
  title,
  subtitle,
  titleClassName,
}: {
  modeLabel: string;
  contextLabel?: string;
  title: string;
  subtitle?: ReactNode;
  titleClassName: string;
}) {
  return (
    <div className="relative flex flex-col items-center text-center">
      <Image src="/shaka.png" alt="" width={40} height={40} className="mb-2 opacity-90" />
      <Image src="/gvc-logotype.svg" alt="Good Vibes Club" width={140} height={28} className="mx-auto opacity-90" />
      <p className="mt-2 font-body text-[10px] uppercase tracking-widest text-white/40">{modeLabel}</p>
      {contextLabel ? <p className="font-body text-xs text-gvc-gold/80">{contextLabel}</p> : null}
      <h2 id="arcade-result-title" className={`mt-3 font-display text-3xl font-black uppercase ${titleClassName}`}>
        {title}
      </h2>
      {subtitle ? <div className="mt-2 max-w-sm font-body text-sm text-white/55">{subtitle}</div> : null}
    </div>
  );
}

function StarRow({ stars, reduceMotion }: { stars: number; reduceMotion: boolean }) {
  return (
    <div className="mt-8 flex justify-center gap-3">
      {[1, 2, 3].map((s) => (
        <motion.span
          key={s}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: reduceMotion ? 0 : 0.08 * s, type: "spring", stiffness: 400, damping: 18 }}
          className={`flex h-12 w-12 items-center justify-center rounded-full border-2 font-display text-xl font-black ${
            s <= stars ? "border-gvc-gold bg-gvc-gold/25 text-gvc-gold shadow-[0_0_20px_rgba(255,224,72,0.35)]" : "border-white/10 text-white/15"
          }`}
        >
          ★
        </motion.span>
      ))}
    </div>
  );
}

function StatsGrid({ stats, reduceMotion }: { stats: ArcadeResultStat[]; reduceMotion: boolean }) {
  return (
    <div className="mt-8 grid grid-cols-2 gap-3 text-left sm:grid-cols-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`rounded-xl border border-white/[0.06] bg-black/45 p-3 ${
            stat.colSpan === 2 ? "col-span-2 sm:col-span-1" : ""
          }`}
        >
          <p className="font-body text-[10px] uppercase tracking-widest text-white/35">{stat.label}</p>
          {stat.animateValue != null ? (
            <AnimatedStatValue value={stat.animateValue} reduceMotion={reduceMotion} highlight={stat.highlight} />
          ) : (
            <p className={`font-display text-2xl ${stat.highlight ? "text-gvc-gold" : "text-white"}`}>{stat.value}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function AnimatedStatValue({
  value,
  reduceMotion,
  highlight,
}: {
  value: number;
  reduceMotion: boolean;
  highlight?: boolean;
}) {
  const [display, setDisplay] = useState(reduceMotion ? value : 0);

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration: 0.85,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [value, reduceMotion]);

  return (
    <motion.p
      key={value}
      initial={reduceMotion ? false : { scale: 1.04 }}
      animate={{ scale: 1 }}
      className={`font-display text-2xl ${highlight ? "text-gvc-gold" : "text-white"}`}
    >
      {display.toLocaleString()}
    </motion.p>
  );
}
