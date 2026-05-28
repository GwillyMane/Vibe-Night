"use client";

import { ArcadeResultShell } from "@/components/arcade/ArcadeResultShell";
import { useArcadeShare } from "@/hooks/useArcadeShare";
import { defaultShowSignIn } from "@/lib/arcade/postRunProps";
import type { CatchEndReason } from "@/lib/catch-a-vibe/catchEndReason";
import { CATCH_END_COPY } from "@/lib/catch-a-vibe/catchEndReason";

export function CatchResultScreen({
  score,
  best,
  maxCombo,
  bloomChains,
  badDodged,
  catches,
  survivalSec,
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
  maxCombo: number;
  bloomChains: number;
  badDodged: number;
  catches: number;
  survivalSec: number;
  endReason: CatchEndReason;
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
  const copy = CATCH_END_COPY[endReason];
  const modeLabel =
    mode === "daily" ? "Daily catch" : mode === "zen" ? "Zen catch" : "Classic catch";

  const { shareToTwitter, copyScore } = useArcadeShare({
    muted,
    gameId: "catch-a-vibe",
    score,
    mode: modeLabel,
    lines: [`Longest Combo: ×${maxCombo}`],
    copyToast: "Catch copied — paste it anywhere.",
  });

  return (
    <ArcadeResultShell
      muted={muted}
      modeLabel={modeLabel}
      title={copy.title}
      subtitle={
        <>
          <p>{copy.detail}</p>
          <p className="mt-2 text-xs text-white/45">{copy.tip}</p>
        </>
      }
      stats={[
        { label: "Score", value: score, animateValue: score, highlight: true },
        ...(mode !== "zen" ? [{ label: "Best", value: best.toLocaleString() }] : []),
        { label: "Combo", value: `×${maxCombo}` },
        { label: "Survival", value: `${Math.floor(survivalSec)}s` },
      ]}
      detailItems={[
        { label: "Bloom chains", value: bloomChains },
        { label: "Catches", value: catches },
        { label: "Bad vibes dodged", value: badDodged },
      ]}
      isNewBest={isNewBest}
      isLoggedIn={signedIn}
      serverRank={serverRank}
      showSignIn={defaultShowSignIn(signedIn, mode !== "zen")}
      onOpenAuth={onSignIn}
      newAchievementSlugs={newAchievementSlugs}
      badgeGameId="catch-a-vibe"
      onRetry={onRetry}
      retryLabel="One more run"
      onShare={shareToTwitter}
      onCopy={() => void copyScore()}
      copyLabel="Copy catch"
      onOpenLeaderboard={onOpenLeaderboard}
      onMenu={onMenu}
    />
  );
}
