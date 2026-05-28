"use client";

import { ArcadeResultShell } from "@/components/arcade/ArcadeResultShell";
import { useArcadeShare } from "@/hooks/useArcadeShare";
import { playUiClick } from "@/lib/sounds";

export interface ResultScreenProps {
  won: boolean;
  score: number;
  stars: 1 | 2 | 3;
  shotsUsed: number;
  maxShots: number;
  levelName: string;
  bestScore: number;
  modeLabel: string;
  muted: boolean;
  onRetry: () => void;
  onNext?: () => void;
  showNext?: boolean;
  newAchievementSlugs?: string[];
  onOpenLeaderboard?: () => void;
  isLoggedIn?: boolean;
  serverRank?: number | null;
  onOpenAuth?: () => void;
}

export function ResultScreen({
  won,
  score,
  stars,
  shotsUsed,
  maxShots,
  levelName,
  bestScore,
  modeLabel,
  muted,
  onRetry,
  onNext,
  showNext,
  newAchievementSlugs,
  onOpenLeaderboard,
  isLoggedIn,
  serverRank,
  onOpenAuth,
}: ResultScreenProps) {
  const { shareToTwitter, copyScore } = useArcadeShare({
    muted,
    gameId: "vibe-crashers",
    score,
    mode: modeLabel,
    lines: [
      `I cleared ${levelName} in Vibe Crashers.`,
      `Stars: ${stars}`,
      `Shots: ${shotsUsed}/${maxShots}`,
    ],
    copyToast: "Crash copied — paste it anywhere.",
  });

  return (
    <ArcadeResultShell
      muted={muted}
      modeLabel={modeLabel}
      contextLabel={levelName}
      title={won ? "Good Vibes Win" : "Out Of Shots"}
      subtitle={
        won ? "Every target cleared. The stack felt that launch." : "Dial in the angle and try again — the physics remember."
      }
      stars={stars}
      stats={[
        { label: "Score", value: score, animateValue: score, highlight: true },
        { label: "Best", value: bestScore.toLocaleString() },
        { label: "Shots", value: `${shotsUsed}/${maxShots}` },
      ]}
      isLoggedIn={isLoggedIn}
      serverRank={serverRank}
      onOpenAuth={onOpenAuth}
      showSignIn={won && !isLoggedIn}
      newAchievementSlugs={newAchievementSlugs}
      badgeGameId="vibe-crashers"
      onRetry={onRetry}
      onNext={onNext}
      showNext={showNext}
      onShare={() => {
        playUiClick(muted);
        shareToTwitter();
      }}
      onCopy={() => void copyScore()}
      copyLabel="Copy crash"
      onOpenLeaderboard={onOpenLeaderboard}
    />
  );
}
