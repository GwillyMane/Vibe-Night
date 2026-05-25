"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { ArcadeDailyHeroPanel } from "@/components/arcade/ArcadeDailyHeroPanel";
import { ArcadeSecondaryGrid } from "@/components/arcade/ArcadeSecondaryGrid";
import { ArcadeTitleShell } from "@/components/arcade/ArcadeTitleShell";
import { readTitleDailyStats } from "@/lib/arcade/titleScreenDaily";
import { PRODUCT_TITLE } from "@/lib/catch-a-vibe/catchConfig";
import { CATCH_RULES_HINT } from "@/lib/catch-a-vibe/catchEndReason";
import { CatchBackgroundPicker } from "./CatchBackgroundPicker";

export function CatchTitleScreen({
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
}: {
  muted: boolean;
  playBackgroundId: string;
  onSelectBackground: (id: string) => void;
  onPlay: () => void;
  onDaily: () => void;
  onZen: () => void;
  onLeaders: () => void;
  onBadges: () => void;
  onCollection: () => void;
  onSettings: () => void;
  onBack?: () => void;
}) {
  const daily = useMemo(() => readTitleDailyStats("catch-a-vibe"), []);

  return (
    <ArcadeTitleShell
      title={PRODUCT_TITLE}
      tagline="Swipe through launching vibes to catch the flow. Chain matching colors, trigger bloom cascades, and dodge Bad Vibes Guy."
      rulesHint={CATCH_RULES_HINT}
      muted={muted}
      onBack={onBack}
      backdropExtra={
        <svg className="h-full w-full" aria-hidden>
          <motion.path
            d="M 40 400 Q 200 200 480 120"
            fill="none"
            stroke="#FFE048"
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: [0.2, 0.7, 0.2] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </svg>
      }
      primaryCta={{ label: "Play", onClick: onPlay }}
      dailyCta={{ label: "Daily catch — quick entry", onClick: onDaily }}
      zenCta={{ label: "Zen catch", onClick: onZen }}
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
        <CatchBackgroundPicker selectedId={playBackgroundId} muted={muted} onSelect={onSelectBackground} />
      }
    >
      <ArcadeDailyHeroPanel
        challengeLabel="Today's catch"
        headline="90-second seeded run"
        dailySeed={daily.dailySeed}
        bestDaily={daily.bestDaily}
        streak={daily.streak}
        playLabel="Play daily catch"
        muted={muted}
        onPlayDaily={onDaily}
      />
    </ArcadeTitleShell>
  );
}
