"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { ProjectileSkinId } from "@/lib/assets/projectileSkins";
import { GOOD_VIBE_FACE_SKINS } from "@/lib/assets/gvcBrandFaces";
import { dailyHandcraftedLevelId, dailyPersistKey, getHandcraftedLevel } from "@/lib/levels";
import { loadPersisted } from "@/lib/storage";
import { playModalOpen, playUiClick } from "@/lib/sounds";
import { ArcadeTitleShell } from "@/components/arcade/ArcadeTitleShell";
import {
  arcadeSecondaryBtnClass,
} from "./gamePanelStyles";
import { GameModal } from "./GameModal";
import { LevelSelect } from "./LevelSelect";
import { ProjectileSkinSelector } from "./ProjectileSkinSelector";
import { CrashersBadgesPanel } from "./GoalsPanel";
import { LeaderboardPanel } from "./LeaderboardPanel";
import { DailyCrashPanel } from "./DailyCrashPanel";

export interface GameMenuProps {
  onSelectLevel: (levelId: string) => void;
  onPracticeLevel?: (levelId: string) => void;
  onPlayDaily: () => void;
  dailySeedPreview: string;
  muted: boolean;
  projectileSkin: ProjectileSkinId;
  tokenOptions: { id: string; name: string; imageUrl: string }[];
  onProjectileSkinChange: (id: ProjectileSkinId) => void;
  onBackToLibrary?: () => void;
}

export function GameMenu({
  onSelectLevel,
  onPracticeLevel,
  onPlayDaily,
  dailySeedPreview,
  muted,
  projectileSkin,
  tokenOptions,
  onProjectileSkinChange,
  onBackToLibrary,
}: GameMenuProps) {
  const c = () => playUiClick(muted);
  const openModal = () => {
    playModalOpen(muted);
  };

  const [levelsOpen, setLevelsOpen] = useState(false);
  const [badgesOpen, setBadgesOpen] = useState(false);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [leaderOpen, setLeaderOpen] = useState(false);

  const faceOptions = GOOD_VIBE_FACE_SKINS.map((f) => ({
    slug: f.slug,
    label: f.label,
    imageUrl: f.url,
  }));

  const persisted = useMemo(() => (typeof window !== "undefined" ? loadPersisted() : null), []);
  const dailyLevelId = dailyHandcraftedLevelId(dailySeedPreview);
  const dailyLevel = getHandcraftedLevel(dailyLevelId);
  const dailyKey = dailyPersistKey(dailySeedPreview, dailyLevelId);
  const bestDaily = persisted?.bestByLevel[dailyKey] ?? 0;
  const streak = persisted?.dailyStreak ?? 0;

  const secondaryBtn = arcadeSecondaryBtnClass;

  return (
    <>
      <ArcadeTitleShell
        title="Vibe Crashers"
        tagline="Launch good vibes. Break bad energy. Clear every crash."
        muted={muted}
        onBack={onBackToLibrary}
        primaryCta={{
          label: "Play",
          onClick: () => {
            c();
            onSelectLevel("1");
          },
        }}
        dailyCta={{
          label: "Daily crash — quick entry",
          onClick: () => {
            c();
            onPlayDaily();
          },
        }}
        secondaryGrid={
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <button
              type="button"
              className={secondaryBtn}
              onClick={() => {
                c();
                openModal();
                setLevelsOpen(true);
              }}
            >
              Levels
            </button>
            <button
              type="button"
              className={secondaryBtn}
              onClick={() => {
                c();
                openModal();
                setBadgesOpen(true);
              }}
            >
              Badges
            </button>
            <button
              type="button"
              className={secondaryBtn}
              onClick={() => {
                c();
                openModal();
                setCollectionOpen(true);
              }}
            >
              Collection
            </button>
            <button
              type="button"
              className={secondaryBtn}
              onClick={() => {
                c();
                openModal();
                setLeaderOpen(true);
              }}
            >
              Leaders
            </button>
          </div>
        }
        footer={
          <button
            type="button"
            onClick={() => {
              c();
              openModal();
              setCollectionOpen(true);
            }}
            className="relative z-[1] flex w-full items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-[#0a0a0a] px-4 py-3 text-left transition hover:border-gvc-gold/30"
          >
            <div>
              <p className="font-display text-[10px] font-bold uppercase tracking-widest text-gvc-gold/90">Projectile</p>
              <p className="font-body text-xs text-white/45">Tap to open collection</p>
            </div>
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-gvc-gold/40 bg-[#0a0a0a]">
              {projectileSkin === "gold" ? (
                <span
                  className="absolute inset-0 block rounded-full"
                  style={{
                    background: "radial-gradient(circle at 30% 30%, #fff8c8, #FFE048 45%, #6a5218)",
                  }}
                />
              ) : projectileSkin === "badge" ? (
                <span className="absolute inset-0 flex items-center justify-center font-display text-[10px] font-black text-gvc-gold">
                  GVC
                </span>
              ) : (
                <Image src="/shaka.png" alt="" fill className="object-cover" sizes="48px" />
              )}
            </div>
          </button>
        }
      >
        <DailyCrashPanel
          dailySeedPreview={dailySeedPreview}
          dailyLevel={dailyLevel}
          bestDaily={bestDaily}
          streak={streak}
          muted={muted}
          onPlayDaily={() => {
            c();
            onPlayDaily();
          }}
          hero
        />
      </ArcadeTitleShell>

      <GameModal open={levelsOpen} onClose={() => setLevelsOpen(false)} title="Levels" subtitle="Twenty handcrafted crashes — same physics for everyone." muted={muted} tall>
        <LevelSelect
          muted={muted}
          embedDaily={false}
          onSelectLevel={(id) => {
            setLevelsOpen(false);
            onSelectLevel(id);
          }}
          onPracticeLevel={
            onPracticeLevel
              ? (id) => {
                  setLevelsOpen(false);
                  onPracticeLevel(id);
                }
              : undefined
          }
          onDaily={() => {
            setLevelsOpen(false);
            onPlayDaily();
          }}
          dailySeedPreview={dailySeedPreview}
        />
      </GameModal>

      <GameModal open={badgesOpen} onClose={() => setBadgesOpen(false)} title="Badges" subtitle="Unlock official GVC library badges." muted={muted} tall>
        <CrashersBadgesPanel />
      </GameModal>

      <GameModal open={collectionOpen} onClose={() => setCollectionOpen(false)} title="Collection" subtitle="Pick the face of your good-vibe shot." muted={muted} tall>
        <ProjectileSkinSelector
          variant="sheet"
          value={projectileSkin}
          tokens={tokenOptions}
          faces={faceOptions}
          onChange={onProjectileSkinChange}
          muted={muted}
        />
      </GameModal>

      <LeaderboardPanel
        open={leaderOpen}
        onClose={() => setLeaderOpen(false)}
        rows={persisted?.localLeaderboard ?? []}
        muted={muted}
        defaultDailySeed={dailySeedPreview}
      />
    </>
  );
}
