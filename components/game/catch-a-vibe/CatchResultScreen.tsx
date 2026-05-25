"use client";

import toast from "react-hot-toast";
import { ArcadeResultShell } from "@/components/arcade/ArcadeResultShell";
import { buildArcadeShareTextWithOg, copyShareText, twitterIntent } from "@/lib/arcade/share";
import type { CatchEndReason } from "@/lib/catch-a-vibe/catchEndReason";
import { CATCH_END_COPY } from "@/lib/catch-a-vibe/catchEndReason";

export function buildCatchShareText(score: number, maxCombo: number, mode: string): string {
  return buildArcadeShareTextWithOg({
    gameId: "catch-a-vibe",
    score,
    mode,
    lines: [`Longest Combo: ×${maxCombo}`],
  });
}

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
  onRetry,
  onMenu,
  onSignIn,
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
  onRetry: () => void;
  onMenu: () => void;
  onSignIn?: () => void;
}) {
  const copy = CATCH_END_COPY[endReason];
  const shareText = buildCatchShareText(score, maxCombo, mode);
  const modeLabel =
    mode === "daily" ? "Daily catch" : mode === "zen" ? "Zen catch" : "Classic catch";

  const share = () => {
    window.open(twitterIntent(shareText), "_blank", "noopener,noreferrer");
  };

  const copyScore = async () => {
    const ok = await copyShareText(shareText);
    if (ok) toast.success("Catch copied — paste it anywhere.", { duration: 2000 });
    else toast.error("Could not copy", { duration: 2000 });
  };

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
      showSignIn={!signedIn && mode !== "zen"}
      onOpenAuth={onSignIn}
      badgeGameId="catch-a-vibe"
      onRetry={onRetry}
      retryLabel="One more run"
      onShare={share}
      onCopy={() => void copyScore()}
      copyLabel="Copy catch"
      onMenu={onMenu}
    />
  );
}
