"use client";

import { ArcadeResultShell } from "@/components/arcade/ArcadeResultShell";
import { useArcadeShare } from "@/hooks/useArcadeShare";
import { defaultShowSignIn } from "@/lib/arcade/postRunProps";
import { tierDef } from "@/lib/vibe-merge/mergeConfig";

const MERGE_END_COPY = {
  title: "Stack collapsed",
  detail: "A vibe sat on the danger line too long — the stack overflowed and the run ended.",
  tip: "Tip: Merge fast to drop the pile. The line pulses when you're close — recover before overflow.",
};

export function MergeResultScreen({
  score,
  best,
  highestTier,
  maxCombo,
  merges,
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
  highestTier: number;
  maxCombo: number;
  merges: number;
  mode: "classic" | "daily";
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
  const tierName = tierDef(highestTier).name;

  const { shareToTwitter, copyScore } = useArcadeShare({
    muted,
    gameId: "vibe-merge",
    score,
    lines: [`Highest vibe: ${tierName}`],
  });

  return (
    <ArcadeResultShell
      muted={muted}
      modeLabel={mode === "daily" ? "Daily stack" : "Classic stack"}
      title={MERGE_END_COPY.title}
      subtitle={
        <>
          <p>{MERGE_END_COPY.detail}</p>
          <p className="mt-2 text-xs text-white/45">{MERGE_END_COPY.tip}</p>
        </>
      }
      stats={[
        { label: "Score", value: score, animateValue: score, highlight: true },
        { label: "Best", value: best.toLocaleString() },
        { label: "Combo", value: `×${maxCombo}` },
      ]}
      detailItems={[
        { label: "Highest vibe", value: tierName },
        { label: "Merges", value: merges },
      ]}
      isNewBest={isNewBest}
      isLoggedIn={signedIn}
      serverRank={serverRank}
      showSignIn={defaultShowSignIn(signedIn, true)}
      onOpenAuth={onSignIn}
      newAchievementSlugs={newAchievementSlugs}
      badgeGameId="vibe-merge"
      onRetry={onRetry}
      retryLabel="One more run"
      onShare={shareToTwitter}
      onCopy={() => void copyScore()}
      onOpenLeaderboard={onOpenLeaderboard}
      onMenu={onMenu}
    />
  );
}

export function buildMergeShareText(score: number, highestTier: number): string {
  const tierName = tierDef(highestTier).name;
  return `Highest vibe: ${tierName}\nScore: ${score.toLocaleString()}`;
}
