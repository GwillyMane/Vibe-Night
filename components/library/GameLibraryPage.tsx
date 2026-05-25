"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { VIBE_NIGHT } from "@/lib/brand";
import { GAME_LIBRARY, type GameCatalogEntry, type GameId } from "@/lib/games/catalog";
import { GameCard } from "./GameCard";
import { GameLaunchModal } from "./GameLaunchModal";
import { NightAccountBar } from "./NightAccountBar";
import { LibraryHero } from "./LibraryHero";
import GameClientGate from "@/components/game/GameClientGate";
import VibeMergeClientGate from "@/components/game/VibeMergeClientGate";
import VibeGardenClientGate from "@/components/game/VibeGardenClientGate";
import CatchAVibeClientGate from "@/components/game/CatchAVibeClientGate";
import VibeShiftClientGate from "@/components/game/VibeShiftClientGate";
import LuckyVibesClientGate from "@/components/game/LuckyVibesClientGate";

export default function GameLibraryPage() {
  const [modalGame, setModalGame] = useState<GameCatalogEntry | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeGameId, setActiveGameId] = useState<GameId | null>(null);

  const openGame = (game: GameCatalogEntry) => {
    setModalGame(game);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalGame(null);
  };

  const launchGame = (id: GameId) => {
    const game = GAME_LIBRARY.find((g) => g.id === id);
    if (!game || game.status !== "available") return;
    setModalOpen(false);
    setModalGame(null);
    setActiveGameId(id);
  };

  const exitToLibrary = () => {
    setActiveGameId(null);
  };

  if (activeGameId === "catch-a-vibe") {
    return (
      <div className="relative min-h-[100dvh]">
        <button
          type="button"
          onClick={exitToLibrary}
          className="fixed left-3 top-3 z-[60] rounded-xl border border-gvc-gold/35 bg-black/75 px-3 py-2 font-display text-[10px] font-bold uppercase tracking-widest text-gvc-gold shadow-lg backdrop-blur-md transition hover:border-gvc-gold/60 hover:bg-black/90 sm:left-4 sm:top-4 sm:text-xs"
        >
          ← {VIBE_NIGHT.shortName}
        </button>
        <CatchAVibeClientGate onExitToLibrary={exitToLibrary} />
      </div>
    );
  }

  if (activeGameId === "vibe-garden") {
    return (
      <div className="relative min-h-[100dvh]">
        <button
          type="button"
          onClick={exitToLibrary}
          className="fixed left-3 top-3 z-[60] rounded-xl border border-gvc-gold/35 bg-black/75 px-3 py-2 font-display text-[10px] font-bold uppercase tracking-widest text-gvc-gold shadow-lg backdrop-blur-md transition hover:border-gvc-gold/60 hover:bg-black/90 sm:left-4 sm:top-4 sm:text-xs"
        >
          ← {VIBE_NIGHT.shortName}
        </button>
        <VibeGardenClientGate onExitToLibrary={exitToLibrary} />
      </div>
    );
  }

  if (activeGameId === "vibe-merge") {
    return (
      <div className="relative min-h-[100dvh]">
        <button
          type="button"
          onClick={exitToLibrary}
          className="fixed left-3 top-3 z-[60] rounded-xl border border-gvc-gold/35 bg-black/75 px-3 py-2 font-display text-[10px] font-bold uppercase tracking-widest text-gvc-gold shadow-lg backdrop-blur-md transition hover:border-gvc-gold/60 hover:bg-black/90 sm:left-4 sm:top-4 sm:text-xs"
        >
          ← {VIBE_NIGHT.shortName}
        </button>
        <VibeMergeClientGate onExitToLibrary={exitToLibrary} />
      </div>
    );
  }

  if (activeGameId === "lucky-vibes") {
    return (
      <div className="relative min-h-[100dvh]">
        <button
          type="button"
          onClick={exitToLibrary}
          className="fixed left-3 top-3 z-[60] rounded-xl border border-gvc-gold/35 bg-black/75 px-3 py-2 font-display text-[10px] font-bold uppercase tracking-widest text-gvc-gold shadow-lg backdrop-blur-md transition hover:border-gvc-gold/60 hover:bg-black/90 sm:left-4 sm:top-4 sm:text-xs"
        >
          ← {VIBE_NIGHT.shortName}
        </button>
        <LuckyVibesClientGate onExitToLibrary={exitToLibrary} />
      </div>
    );
  }

  if (activeGameId === "vibe-shift") {
    return (
      <div className="relative min-h-[100dvh]">
        <button
          type="button"
          onClick={exitToLibrary}
          className="fixed left-3 top-3 z-[60] rounded-xl border border-gvc-gold/35 bg-black/75 px-3 py-2 font-display text-[10px] font-bold uppercase tracking-widest text-gvc-gold shadow-lg backdrop-blur-md transition hover:border-gvc-gold/60 hover:bg-black/90 sm:left-4 sm:top-4 sm:text-xs"
        >
          ← {VIBE_NIGHT.shortName}
        </button>
        <VibeShiftClientGate onExitToLibrary={exitToLibrary} />
      </div>
    );
  }

  if (activeGameId === "vibe-crashers") {
    return (
      <div className="relative min-h-[100dvh]">
        <button
          type="button"
          onClick={exitToLibrary}
          className="fixed left-3 top-3 z-[60] rounded-xl border border-gvc-gold/35 bg-black/75 px-3 py-2 font-display text-[10px] font-bold uppercase tracking-widest text-gvc-gold shadow-lg backdrop-blur-md transition hover:border-gvc-gold/60 hover:bg-black/90 sm:left-4 sm:top-4 sm:text-xs"
        >
          ← {VIBE_NIGHT.shortName}
        </button>
        <GameClientGate onExitToLibrary={exitToLibrary} />
      </div>
    );
  }

  return (
    <div className="relative mx-auto min-h-[100dvh] w-full max-w-6xl px-4 pb-arcade-player pt-arcade-player sm:px-6 sm:pt-10">
      <div className="mb-4 flex justify-end sm:absolute sm:right-6 sm:top-8 sm:mb-0 sm:z-10">
        <NightAccountBar />
      </div>

      <LibraryHero />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-2 lg:gap-6 xl:grid-cols-2">
        {GAME_LIBRARY.map((game, i) => (
          <GameCard key={game.id} game={game} index={i} onOpen={() => openGame(game)} />
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="mx-auto mt-10 max-w-lg text-center font-body text-xs leading-relaxed text-white/40"
      >
        New titles join the lineup as they ship. Sign in once — progress follows you everywhere.
      </motion.p>

      <GameLaunchModal
        game={modalGame}
        open={modalOpen}
        onClose={closeModal}
        onLaunch={launchGame}
      />
    </div>
  );
}
