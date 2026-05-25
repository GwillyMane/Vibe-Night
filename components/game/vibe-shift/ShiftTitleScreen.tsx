"use client";

import { useMemo, type ReactNode } from "react";
import { motion } from "framer-motion";
import { ArcadeDailyHeroPanel } from "@/components/arcade/ArcadeDailyHeroPanel";
import { ArcadeSecondaryGrid } from "@/components/arcade/ArcadeSecondaryGrid";
import { ArcadeTitleShell } from "@/components/arcade/ArcadeTitleShell";
import { readTitleDailyStats } from "@/lib/arcade/titleScreenDaily";
import { DAILY_MOVE_BUDGET, PRODUCT_TITLE } from "@/lib/vibe-shift/shiftConfig";
import { SHIFT_RULES_HINT } from "@/lib/vibe-shift/shiftEndReason";
import { CatchBackgroundPicker } from "../catch-a-vibe/CatchBackgroundPicker";

export function ShiftTitleScreen({
  muted,
  playBackgroundId,
  onSelectBackground,
  onPlay,
  onDaily,
  onLeaders,
  onBadges,
  onSettings,
  onBack,
  resume,
}: {
  muted: boolean;
  playBackgroundId: string;
  onSelectBackground: (id: string) => void;
  onPlay: () => void;
  onDaily: () => void;
  onLeaders: () => void;
  onBadges: () => void;
  onSettings: () => void;
  onBack?: () => void;
  resume?: ReactNode;
}) {
  const daily = useMemo(() => readTitleDailyStats("vibe-shift"), []);

  return (
    <ArcadeTitleShell
      title={PRODUCT_TITLE}
      tagline="Slide rows and columns to line up matching GVC faces. Only matching shifts stick — no match, no move spent."
      rulesHint={SHIFT_RULES_HINT}
      muted={muted}
      onBack={onBack}
      backdropExtra={
        <svg className="h-full w-full" aria-hidden>
          <motion.g
            animate={{ rotate: [0, 90, 180, 270, 360] }}
            transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: "50% 50%" }}
          >
            {[0, 1, 2, 3].map((i) => (
              <rect
                key={i}
                x={120 + i * 40}
                y={80 + i * 30}
                width={48}
                height={48}
                rx={8}
                fill="none"
                stroke="#FFE048"
                strokeWidth={2}
                opacity={0.25}
              />
            ))}
          </motion.g>
        </svg>
      }
      primaryCta={{ label: "Play", onClick: onPlay }}
      dailyCta={{ label: "Daily shift — quick entry", onClick: onDaily }}
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
      backgroundPicker={
        <CatchBackgroundPicker selectedId={playBackgroundId} muted={muted} onSelect={onSelectBackground} />
      }
    >
      {resume}
      <ArcadeDailyHeroPanel
        challengeLabel="Today's shift"
        headline={`${DAILY_MOVE_BUDGET} moves · seeded board`}
        dailySeed={daily.dailySeed}
        bestDaily={daily.bestDaily}
        streak={daily.streak}
        playLabel="Play daily shift"
        muted={muted}
        onPlayDaily={onDaily}
      />
    </ArcadeTitleShell>
  );
}
