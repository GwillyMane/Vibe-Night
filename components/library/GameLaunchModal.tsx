"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Play, Sparkles } from "lucide-react";
import type { GameCatalogEntry } from "@/lib/games/catalog";
import { GameModal } from "@/components/game/GameModal";

export interface GameLaunchModalProps {
  game: GameCatalogEntry | null;
  open: boolean;
  onClose: () => void;
  onLaunch: (gameId: GameCatalogEntry["id"]) => void;
  muted?: boolean;
}

export function GameLaunchModal({ game, open, onClose, onLaunch, muted = false }: GameLaunchModalProps) {
  if (!game) return null;

  const available = game.status === "available";

  return (
    <GameModal
      open={open}
      onClose={onClose}
      title={game.title}
      subtitle={game.launchSubtitle ?? game.tagline}
      muted={muted}
      tall
    >
      <div className="flex flex-col gap-5">
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-white/10 bg-black/50">
          <Image
            src={game.previewImage}
            alt={game.previewAlt}
            fill
            className={`object-cover ${available ? "" : "grayscale opacity-60"}`}
            sizes="(max-width: 512px) 100vw, 480px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/80 via-transparent to-transparent" />
        </div>

        <p className="font-body text-sm leading-relaxed text-white/65">{game.description}</p>

        <ul className="flex flex-col gap-2">
          {game.features.map((f) => (
            <li key={f} className="flex items-start gap-2 font-body text-xs text-white/55">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gvc-gold/80" aria-hidden />
              {f}
            </li>
          ))}
        </ul>

        {available ? (
          <motion.button
            type="button"
            whileTap={{ scale: 0.99 }}
            onClick={() => onLaunch(game.id)}
            className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-gvc-gold px-4 py-3 font-display text-base font-black uppercase tracking-wide text-gvc-black shadow-[0_0_32px_rgba(255,224,72,0.35)] transition hover:shadow-[0_0_44px_rgba(255,224,72,0.45)]"
          >
            <Play className="h-5 w-5 fill-current" aria-hidden />
            Launch game
          </motion.button>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-4 text-center">
            <p className="font-display text-sm font-bold uppercase tracking-widest text-white/50">Coming soon</p>
            <p className="mt-1 font-body text-xs text-white/40">This slot is ready for the next Vibe Night title.</p>
          </div>
        )}
      </div>
    </GameModal>
  );
}
