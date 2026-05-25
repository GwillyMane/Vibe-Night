"use client";

import { useMemo, type ReactNode } from "react";
import { ArcadeDailyHeroPanel } from "@/components/arcade/ArcadeDailyHeroPanel";
import { ArcadeSecondaryGrid } from "@/components/arcade/ArcadeSecondaryGrid";
import { ArcadeTitleShell } from "@/components/arcade/ArcadeTitleShell";
import { readTitleDailyStats } from "@/lib/arcade/titleScreenDaily";
import { DAILY_SPIN_BUDGET, LUCKY_RULES_HINT, PRODUCT_TITLE } from "@/lib/lucky-vibes/luckyConfig";

export function LuckyTitleScreen({
  muted,
  onPlay,
  onDaily,
  onZen,
  onLeaders,
  onBadges,
  onSettings,
  onBack,
  resume,
}: {
  muted: boolean;
  onPlay: () => void;
  onDaily: () => void;
  onZen: () => void;
  onLeaders: () => void;
  onBadges: () => void;
  onSettings: () => void;
  onBack?: () => void;
  resume?: ReactNode;
}) {
  const daily = useMemo(() => readTitleDailyStats("lucky-vibes"), []);

  return (
    <ArcadeTitleShell
      title={PRODUCT_TITLE}
      tagline="Spin · stack · surge — match GVC faces and premium citizens across 1,024 ways."
      rulesHint={LUCKY_RULES_HINT}
      muted={muted}
      onBack={onBack}
      backdropExtra={
        <div className="h-full w-full bg-gradient-to-br from-[#FF6B9D22] via-transparent to-[#FFE04818]" />
      }
      primaryCta={{ label: "Play", onClick: onPlay }}
      dailyCta={{ label: "Daily spins — quick entry", onClick: onDaily }}
      zenCta={{ label: "Zen mode", onClick: onZen }}
      secondaryGrid={
        <ArcadeSecondaryGrid
          muted={muted}
          columns={3}
          actions={[
            { label: "Badges", onClick: onBadges },
            { label: "Leaders", onClick: onLeaders },
            { label: "Settings", onClick: onSettings },
          ]}
        />
      }
    >
      {resume}
      <ArcadeDailyHeroPanel
        challengeLabel="Today's daily"
        headline={`${DAILY_SPIN_BUDGET} spins · seeded reels`}
        dailySeed={daily.dailySeed}
        bestDaily={daily.bestDaily}
        streak={daily.streak}
        playLabel="Play daily spins"
        muted={muted}
        onPlayDaily={onDaily}
      />
    </ArcadeTitleShell>
  );
}
