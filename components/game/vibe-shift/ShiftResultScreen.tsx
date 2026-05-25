"use client";

import toast from "react-hot-toast";
import { ArcadeResultShell } from "@/components/arcade/ArcadeResultShell";
import { buildArcadeShareTextWithOg, copyShareText, twitterIntent } from "@/lib/arcade/share";
import { endReasonLabel, isWinReason } from "@/lib/vibe-shift/shiftEndReason";
import type { ShiftEndReason } from "@/lib/vibe-shift/shiftEndReason";
import type { ShiftMode } from "@/lib/vibe-shift/shiftConfig";

export function buildShiftShareText(score: number, mode: ShiftMode): string {
  const modeLabel = mode === "daily" ? "Daily Shift" : "Classic Shift";
  return buildArcadeShareTextWithOg({
    gameId: "vibe-shift",
    score,
    mode: modeLabel,
  });
}

export function ShiftResultScreen({
  mode,
  score,
  level,
  endReason,
  isNewBest,
  muted,
  onRestart,
  onMenu,
}: {
  mode: ShiftMode;
  score: number;
  level: number;
  endReason: ShiftEndReason | null;
  isNewBest: boolean;
  muted: boolean;
  onRestart: () => void;
  onMenu: () => void;
}) {
  const won = isWinReason(endReason, mode);
  const shareText = buildShiftShareText(score, mode);

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
      badgeGameId="vibe-shift"
      onRetry={onRestart}
      retryLabel="Play again"
      onShare={share}
      onCopy={() => void copyScore()}
      onMenu={onMenu}
    />
  );
}
