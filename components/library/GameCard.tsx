"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArcadeEmberBackdrop } from "@/components/arcade/ArcadeEmberBackdrop";
import type { GameCatalogEntry } from "@/lib/games/catalog";
import { dailyCardLabel } from "@/lib/arcade/dailyCopy";
import { readHubGameStats } from "@/lib/arcade/hubStats";

export interface GameCardProps {
  game: GameCatalogEntry;
  index: number;
  onOpen: () => void;
}

export function GameCard({ game, index, onOpen }: GameCardProps) {
  const comingSoon = game.status === "coming_soon";
  const [dailyBest, setDailyBest] = useState(0);
  const [dailySeed, setDailySeed] = useState("");

  useEffect(() => {
    const stats = readHubGameStats(game.id);
    setDailyBest(stats.dailyBest);
    setDailySeed(stats.dailySeed);
  }, [game.id]);

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      whileHover={{ scale: comingSoon ? 1 : 1.02 }}
      whileTap={{ scale: comingSoon ? 1 : 0.98 }}
      onClick={onOpen}
      className={`group relative aspect-[16/10] w-full overflow-hidden rounded-2xl border text-left transition-shadow ${
        comingSoon
          ? "cursor-default border-white/10 opacity-85"
          : "cursor-pointer border-gvc-gold/25 card-glow hover:border-gvc-gold/45 hover:shadow-[0_0_40px_rgba(255,224,72,0.12)]"
      }`}
    >
      <ArcadeEmberBackdrop className="opacity-40" />
      <Image
        src={game.previewImage}
        alt={game.previewAlt}
        fill
        className={`object-cover transition duration-500 ${
          comingSoon ? "grayscale opacity-50" : "group-hover:scale-[1.04]"
        }`}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        priority={index === 0}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/55 to-[#050505]/15" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/30" aria-hidden />

      {comingSoon ? (
        <span className="absolute right-3 top-3 z-10 rounded-full border border-white/15 bg-black/75 px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-wider text-white/70 backdrop-blur-sm">
          Soon
        </span>
      ) : (
        <span className="absolute right-3 top-3 z-10 rounded-full border border-gvc-gold/45 bg-black/75 px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-wider text-gvc-gold backdrop-blur-sm">
          Play
        </span>
      )}

      {!comingSoon && dailySeed ? (
        <span className="absolute left-3 top-3 z-10 rounded-full border border-pink-accent/35 bg-black/75 px-2.5 py-1 font-display text-[9px] font-bold uppercase tracking-wider text-pink-accent/90 backdrop-blur-sm">
          {dailyCardLabel()}
        </span>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-2 p-4 sm:p-5">
        <h2 className="font-display text-2xl font-black uppercase leading-[0.95] tracking-wide text-shimmer sm:text-3xl">
          {game.title}
        </h2>
        <p className="max-w-[95%] font-body text-sm leading-snug text-white/80">{game.tagline}</p>
        {dailyBest > 0 ? (
          <p className="font-body text-[10px] text-white/50">
            Daily best <span className="font-display font-bold text-gvc-gold">{dailyBest.toLocaleString()}</span>
          </p>
        ) : null}
        <div className="flex flex-wrap gap-1.5">
          {game.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-white/15 bg-black/55 px-2 py-0.5 font-body text-[10px] uppercase tracking-wide text-white/70 backdrop-blur-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.button>
  );
}
