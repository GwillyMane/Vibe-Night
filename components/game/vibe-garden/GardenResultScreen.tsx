"use client";

import { ArcadeResultShell } from "@/components/arcade/ArcadeResultShell";
import { useArcadeShare } from "@/hooks/useArcadeShare";
import { defaultShowSignIn } from "@/lib/arcade/postRunProps";
import type { GardenEndReason } from "@/lib/vibe-garden/gardenEndReason";
import { GARDEN_END_COPY } from "@/lib/vibe-garden/gardenEndReason";

export function GardenResultScreen({
  score,
  best,
  maxChain,
  cleanses,
  survivalSec,
  stability,
  corruption,
  endReason,
  mode,
  isNewBest,
  muted,
  signedIn,
  serverRank,
  newAchievementSlugs,
  onRetry,
  onMenu,
  onSignIn,
  onOpenLeaderboard,
}: {
  score: number;
  best: number;
  maxChain: number;
  cleanses: number;
  survivalSec: number;
  stability: number;
  corruption: number;
  endReason: GardenEndReason;
  mode: "classic" | "daily" | "zen";
  isNewBest: boolean;
  muted: boolean;
  signedIn: boolean;
  serverRank?: number | null;
  newAchievementSlugs?: string[];
  onRetry: () => void;
  onMenu: () => void;
  onSignIn?: () => void;
  onOpenLeaderboard?: () => void;
}) {
  const copy = GARDEN_END_COPY[endReason];
  const isWin = endReason === "daily_complete";
  const modeLabel =
    mode === "daily" ? "Daily garden" : mode === "zen" ? "Zen garden" : "Classic garden";

  const { shareToTwitter, copyScore } = useArcadeShare({
    muted,
    gameId: "vibe-garden",
    score,
    lines: [`Largest Cascade: ${maxChain}×`],
  });

  return (
    <ArcadeResultShell
      muted={muted}
      modeLabel={modeLabel}
      title={copy.title}
      titleClassName={isWin ? "text-gvc-green" : "text-shimmer"}
      subtitle={
        <>
          <p>{copy.detail}</p>
          <p className="mt-2 text-xs text-white/45">{copy.tip}</p>
        </>
      }
      stats={[
        { label: "Score", value: score, animateValue: score, highlight: true },
        ...(mode !== "zen" ? [{ label: "Best", value: best.toLocaleString() }] : []),
        { label: "Cascade", value: `${maxChain}×` },
        { label: "Survival", value: `${Math.floor(survivalSec)}s` },
      ]}
      detailItems={[
        { label: "Final corruption", value: `${Math.round(corruption)}%` },
        { label: "Final stability", value: `${Math.round(stability)}%` },
        { label: "Corruption cleansed", value: cleanses },
      ]}
      isNewBest={isNewBest}
      isLoggedIn={signedIn}
      serverRank={serverRank}
      showSignIn={defaultShowSignIn(signedIn, mode !== "zen")}
      onOpenAuth={onSignIn}
      newAchievementSlugs={newAchievementSlugs}
      badgeGameId="vibe-garden"
      onRetry={onRetry}
      retryLabel="One more run"
      onShare={shareToTwitter}
      onCopy={() => void copyScore()}
      onOpenLeaderboard={onOpenLeaderboard}
      onMenu={onMenu}
    />
  );
}

export function buildGardenShareText(score: number, maxChain: number): string {
  return `Largest Cascade: ${maxChain}×\nScore: ${score.toLocaleString()}`;
}
