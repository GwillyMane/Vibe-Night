"use client";

import toast from "react-hot-toast";
import { ArcadeResultShell } from "@/components/arcade/ArcadeResultShell";
import { buildArcadeShareTextWithOg, copyShareText, twitterIntent } from "@/lib/arcade/share";
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
  /** Achievement slugs unlocked this run */
  newAchievementSlugs?: string[];
  onOpenLeaderboard?: () => void;
  /** Logged-in user sees server rank after submit */
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
  const c = () => playUiClick(muted);

  const share = () => {
    c();
    const text = buildArcadeShareTextWithOg({
      gameId: "vibe-crashers",
      score,
      mode: modeLabel,
      lines: [
        `I cleared ${levelName} in Vibe Crashers.`,
        `Stars: ${stars}`,
        `Shots: ${shotsUsed}/${maxShots}`,
      ],
    });
    window.open(twitterIntent(text), "_blank", "noopener,noreferrer");
  };

  const copyScore = async () => {
    c();
    const line = buildArcadeShareTextWithOg({
      gameId: "vibe-crashers",
      score,
      mode: modeLabel,
      lines: [
        `I cleared ${levelName} in Vibe Crashers.`,
        `Stars: ${stars}`,
        `Shots: ${shotsUsed}/${maxShots}`,
      ],
    });
    const ok = await copyShareText(line);
    if (ok) toast.success("Crash copied — paste it anywhere.", { duration: 2000 });
    else toast.error("Could not copy", { duration: 2000 });
  };

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
      onShare={share}
      onCopy={() => void copyScore()}
      copyLabel="Copy crash"
      onOpenLeaderboard={onOpenLeaderboard}
    />
  );
}
