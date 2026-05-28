"use client";

import { ArcadeResultShell } from "@/components/arcade/ArcadeResultShell";
import { useArcadeShare } from "@/hooks/useArcadeShare";
import { defaultShowSignIn } from "@/lib/arcade/postRunProps";
import { endReasonLabel, isWinReason } from "@/lib/vibe-shift/shiftEndReason";
import type { ShiftEndReason } from "@/lib/vibe-shift/shiftEndReason";
import type { ShiftMode } from "@/lib/vibe-shift/shiftConfig";

export function ShiftResultScreen({
  mode,
  score,
  level,
  endReason,
  isNewBest,
  muted,
  isLoggedIn,
  serverRank,
  newAchievementSlugs,
  onOpenAuth,
  onOpenLeaderboard,
  onRestart,
  onMenu,
}: {
  mode: ShiftMode;
  score: number;
  level: number;
  endReason: ShiftEndReason | null;
  isNewBest: boolean;
  muted: boolean;
  isLoggedIn?: boolean;
  serverRank?: number | null;
  newAchievementSlugs?: string[];
  onOpenAuth?: () => void;
  onOpenLeaderboard?: () => void;
  onRestart: () => void;
  onMenu: () => void;
}) {
  const won = isWinReason(endReason, mode);
  const modeShareLabel = mode === "daily" ? "Daily Shift" : "Classic Shift";

  const { shareToTwitter, copyScore } = useArcadeShare({
    muted,
    gameId: "vibe-shift",
    score,
    mode: modeShareLabel,
  });

  return (
    <ArcadeResultShell
      muted={muted}
      modeLabel={mode === "daily" ? "Daily shift" : "Classic shift"}
      contextLabel={mode === "classic" ? `Level ${level}` : undefined}
      title={won ? "Full shift!" : "Run ended"}
      subtitle={endReasonLabel(endReason)}
      stats={[
        { label: "Score", value: score, animateValue: score, highlight: true },
        ...(mode === "classic" ? [{ label: "Level", value: level }] : []),
        { label: "Mode", value: mode },
      ]}
      isNewBest={isNewBest}
      isLoggedIn={isLoggedIn}
      serverRank={serverRank}
      showSignIn={defaultShowSignIn(!!isLoggedIn, true)}
      onOpenAuth={onOpenAuth}
      newAchievementSlugs={newAchievementSlugs}
      badgeGameId="vibe-shift"
      onRetry={onRestart}
      retryLabel="Play again"
      onShare={shareToTwitter}
      onCopy={() => void copyScore()}
      onOpenLeaderboard={onOpenLeaderboard}
      onMenu={onMenu}
    />
  );
}
