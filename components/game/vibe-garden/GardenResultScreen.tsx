"use client";

import toast from "react-hot-toast";
import { ArcadeResultShell } from "@/components/arcade/ArcadeResultShell";
import { buildArcadeShareTextWithOg, copyShareText, twitterIntent } from "@/lib/arcade/share";
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
  onRetry,
  onMenu,
  onSignIn,
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
  onRetry: () => void;
  onMenu: () => void;
  onSignIn?: () => void;
}) {
  const copy = GARDEN_END_COPY[endReason];
  const isWin = endReason === "daily_complete";
  const shareText = buildGardenShareText(score, maxChain);
  const modeLabel =
    mode === "daily" ? "Daily garden" : mode === "zen" ? "Zen garden" : "Classic garden";

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
      showSignIn={!signedIn && mode !== "zen"}
      onOpenAuth={onSignIn}
      badgeGameId="vibe-garden"
      onRetry={onRetry}
      retryLabel="One more run"
      onShare={share}
      onCopy={() => void copyScore()}
      onMenu={onMenu}
    />
  );
}

export function buildGardenShareText(score: number, maxChain: number): string {
  return buildArcadeShareTextWithOg({
    gameId: "vibe-garden",
    score,
    lines: [`Largest Cascade: ${maxChain}×`],
  });
}
