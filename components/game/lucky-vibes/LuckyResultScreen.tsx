"use client";

import { ArcadeResultShell } from "@/components/arcade/ArcadeResultShell";
import { useArcadeShare } from "@/hooks/useArcadeShare";
import { defaultShowSignIn } from "@/lib/arcade/postRunProps";
import { type LuckyMode } from "@/lib/lucky-vibes/luckyConfig";

export function LuckyResultScreen({
  mode,
  score,
  spinsUsed,
  bestSingleSpin,
  maxMultiplier,
  luckySpinsTriggered,
  vibeLockTriggered,
  grandVibe,
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
  mode: LuckyMode;
  score: number;
  spinsUsed: number;
  bestSingleSpin: number;
  maxMultiplier: number;
  luckySpinsTriggered: number;
  vibeLockTriggered: number;
  grandVibe: boolean;
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
  const modeLabel =
    mode === "daily" ? "Daily run" : mode === "zen" ? "Zen session" : "Classic run";
  const submitEligible = mode !== "zen";

  const { shareToTwitter, copyScore } = useArcadeShare({
    muted,
    gameId: "lucky-vibes",
    score,
    mode: modeLabel,
  });

  return (
    <ArcadeResultShell
      muted={muted}
      modeLabel={modeLabel}
      title="Run complete"
      stats={[
        { label: "Score", value: score, animateValue: score, highlight: true },
        { label: "Best spin", value: bestSingleSpin.toLocaleString() },
        { label: "Max mult", value: `×${maxMultiplier}` },
      ]}
      detailItems={[
        { label: "Spins used", value: spinsUsed },
        { label: "Lucky Spins", value: luckySpinsTriggered },
        { label: "Vibe Lock", value: vibeLockTriggered },
        ...(grandVibe ? [{ label: "Grand Vibe", value: "Yes!" }] : []),
      ]}
      isNewBest={isNewBest}
      isLoggedIn={isLoggedIn}
      serverRank={serverRank}
      showSignIn={defaultShowSignIn(!!isLoggedIn, submitEligible)}
      onOpenAuth={onOpenAuth}
      newAchievementSlugs={newAchievementSlugs}
      badgeGameId="lucky-vibes"
      onRetry={onRestart}
      retryLabel="One more run"
      onShare={shareToTwitter}
      onCopy={() => void copyScore()}
      onOpenLeaderboard={onOpenLeaderboard}
      onMenu={onMenu}
    />
  );
}
