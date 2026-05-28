"use client";

import { useMemo, type ReactNode } from "react";
import { ArcadeDailyHeroPanel } from "@/components/arcade/ArcadeDailyHeroPanel";
import { ArcadeSecondaryGrid } from "@/components/arcade/ArcadeSecondaryGrid";
import { ArcadeTitleShell } from "@/components/arcade/ArcadeTitleShell";
import { readTitleDailyStats } from "@/lib/arcade/titleScreenDaily";
import { PRODUCT_TITLE } from "@/lib/vibe-garden/gardenConfig";
import { GARDEN_RULES_HINT } from "@/lib/vibe-garden/gardenEndReason";
import { GardenBackgroundPicker } from "./GardenBackgroundPicker";

export function GardenTitleScreen({
  muted,
  playBackgroundId,
  onSelectBackground,
  onPlay,
  onDaily,
  onZen,
  onLeaders,
  onBadges,
  onCollection,
  onSettings,
  onBack,
  resume,
}: {
  muted: boolean;
  playBackgroundId: string;
  onSelectBackground: (id: string) => void;
  onPlay: () => void;
  onDaily: () => void;
  onZen: () => void;
  onLeaders: () => void;
  onBadges: () => void;
  onCollection?: () => void;
  onSettings: () => void;
  onBack?: () => void;
  resume?: ReactNode;
}) {
  const daily = useMemo(() => readTitleDailyStats("vibe-garden"), []);

  const secondaryActions = [
    { label: "Badges", onClick: onBadges },
    ...(onCollection ? [{ label: "Collection", onClick: onCollection }] : []),
    { label: "Leaders", onClick: onLeaders },
    { label: "Settings", onClick: onSettings },
  ];

  return (
    <ArcadeTitleShell
      title={PRODUCT_TITLE}
      tagline="Plant matching vibes in clusters. Chain blooms and contain corruption before the garden collapses."
      rulesHint={GARDEN_RULES_HINT}
      muted={muted}
      onBack={onBack}
      primaryCta={{ label: "Play", onClick: onPlay }}
      dailyCta={{ label: "Daily garden — quick entry", onClick: onDaily }}
      zenCta={{ label: "Zen garden", onClick: onZen }}
      secondaryGrid={
        <ArcadeSecondaryGrid
          muted={muted}
          columns={secondaryActions.length === 4 ? 4 : 3}
          actions={secondaryActions}
        />
      }
      backgroundPicker={
        <GardenBackgroundPicker selectedId={playBackgroundId} muted={muted} onSelect={onSelectBackground} />
      }
    >
      {resume}
      <ArcadeDailyHeroPanel
        challengeLabel="Today's garden"
        headline="90-second seeded garden"
        dailySeed={daily.dailySeed}
        bestDaily={daily.bestDaily}
        streak={daily.streak}
        playLabel="Play daily garden"
        muted={muted}
        onPlayDaily={onDaily}
      />
    </ArcadeTitleShell>
  );
}
