"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GAME_LIBRARY, gameRoutePath, type GameCatalogEntry, type GameId } from "@/lib/games/catalog";
import { GameCard } from "./GameCard";
import { GameLaunchModal } from "./GameLaunchModal";
import { NightAccountBar } from "./NightAccountBar";
import { LibraryHero } from "./LibraryHero";

export default function GameLibraryPage() {
  const router = useRouter();
  const [modalGame, setModalGame] = useState<GameCatalogEntry | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

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
    router.push(gameRoutePath(id));
  };

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

      <GameLaunchModal game={modalGame} open={modalOpen} onClose={closeModal} onLaunch={launchGame} />
    </div>
  );
}
