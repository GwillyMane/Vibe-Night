"use client";

import { useMemo } from "react";
import { ArcadeDailyHeroPanel } from "@/components/arcade/ArcadeDailyHeroPanel";
import { ArcadeSecondaryGrid } from "@/components/arcade/ArcadeSecondaryGrid";
import { ArcadeTitleShell } from "@/components/arcade/ArcadeTitleShell";
import { readTitleDailyStats } from "@/lib/arcade/titleScreenDaily";
import { PRODUCT_TITLE } from "@/lib/vibe-merge/mergeConfig";
import { MergeBackgroundPicker } from "./MergeBackgroundPicker";

export function MergeTitleScreen({
  muted,
  playBackgroundId,
  onSelectBackground,
  onPlay,
  onDaily,
  onLeaders,
  onBadges,
  onCollection,
  onSettings,
  onBack,
}: {
  muted: boolean;
  playBackgroundId: string;
  onSelectBackground: (id: string) => void;
  onPlay: () => void;
  onDaily: () => void;
  onLeaders: () => void;
  onBadges: () => void;
  onCollection: () => void;
  onSettings: () => void;
  onBack?: () => void;
}) {
  const daily = useMemo(() => readTitleDailyStats("vibe-merge"), []);

  return (
    <ArcadeTitleShell
      title={PRODUCT_TITLE}
      tagline="Drop matching vibes. Climb the 10-tier chain. Don't overflow."
      muted={muted}
      onBack={onBack}
      primaryCta={{ label: "Play", onClick: onPlay }}
      dailyCta={{ label: "Daily stack — quick entry", onClick: onDaily }}
      secondaryGrid={
        <ArcadeSecondaryGrid
          muted={muted}
          columns={4}
          actions={[
            { label: "Badges", onClick: onBadges },
            { label: "Collection", onClick: onCollection },
            { label: "Leaders", onClick: onLeaders },
            { label: "Settings", onClick: onSettings },
          ]}
        />
      }
      backgroundPicker={
        <MergeBackgroundPicker selectedId={playBackgroundId} muted={muted} onSelect={onSelectBackground} />
      }
    >
      <ArcadeDailyHeroPanel
        challengeLabel="Today's stack"
        headline="Seeded drop stack"
        dailySeed={daily.dailySeed}
        bestDaily={daily.bestDaily}
        streak={daily.streak}
        playLabel="Play daily stack"
        muted={muted}
        onPlayDaily={onDaily}
      />
    </ArcadeTitleShell>
  );
}
