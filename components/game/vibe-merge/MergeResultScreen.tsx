"use client";

import toast from "react-hot-toast";
import { ArcadeResultShell } from "@/components/arcade/ArcadeResultShell";
import { buildArcadeShareTextWithOg, copyShareText, twitterIntent } from "@/lib/arcade/share";
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
  onRetry,
  onMenu,
  onSignIn,
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
  onRetry: () => void;
  onMenu: () => void;
  onSignIn?: () => void;
}) {
  const tierName = tierDef(highestTier).name;
  const shareText = buildMergeShareText(score, highestTier);

  const share = () => {
    window.open(twitterIntent(shareText), "_blank", "noopener,noreferrer");
  };

  const copyScore = async () => {
    const ok = await copyShareText(shareText);
    if (ok) toast.success("Score copied — paste it anywhere.", { duration: 2000 });
    else toast.error("Could not copy", { duration: 2000 });
  };

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
      showSignIn={!signedIn}
      onOpenAuth={onSignIn}
      badgeGameId="vibe-merge"
      onRetry={onRetry}
      retryLabel="One more run"
      onShare={share}
      onCopy={() => void copyScore()}
      onMenu={onMenu}
    />
  );
}

export function buildMergeShareText(score: number, highestTier: number): string {
  const tierName = tierDef(highestTier).name;
  return buildArcadeShareTextWithOg({
    gameId: "vibe-merge",
    score,
    lines: [`Highest vibe: ${tierName}`],
  });
}
