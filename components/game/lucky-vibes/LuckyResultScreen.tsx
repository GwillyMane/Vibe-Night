"use client";

import toast from "react-hot-toast";
import { ArcadeResultShell } from "@/components/arcade/ArcadeResultShell";
import { buildArcadeShareTextWithOg, copyShareText, twitterIntent } from "@/lib/arcade/share";
import { type LuckyMode } from "@/lib/lucky-vibes/luckyConfig";

export function buildLuckyShareText(score: number, mode: LuckyMode): string {
  const modeLabel = mode === "daily" ? "Daily" : mode === "zen" ? "Zen" : "Classic";
  return buildArcadeShareTextWithOg({
    gameId: "lucky-vibes",
    score,
    mode: modeLabel,
  });
}

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
  onRestart: () => void;
  onMenu: () => void;
}) {
  const shareText = buildLuckyShareText(score, mode);
  const modeLabel =
    mode === "daily" ? "Daily run" : mode === "zen" ? "Zen session" : "Classic run";

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
      badgeGameId="lucky-vibes"
      onRetry={onRestart}
      retryLabel="One more run"
      onShare={share}
      onCopy={() => void copyScore()}
      onMenu={onMenu}
    />
  );
}
