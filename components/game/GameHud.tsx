"use client";

import { Trophy } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import { playUiClick } from "@/lib/sounds";

export interface GameHudProps {
  score: number;
  shotsLeft: number;
  levelLabel: string;
  muted: boolean;
  projectilePreviewSrc: string | null;
  projectileIsProceduralGold: boolean;
  projectileIsProceduralBadge: boolean;
  onOpenLeaderboard: () => void;
}

export function GameHud({
  score,
  shotsLeft,
  levelLabel,
  muted,
  projectilePreviewSrc,
  projectileIsProceduralGold,
  projectileIsProceduralBadge,
  onOpenLeaderboard,
}: GameHudProps) {
  const click = () => playUiClick(muted);

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative z-20 shrink-0 px-0 pb-2 pt-[max(2px,env(safe-area-inset-top))]"
    >
      <div className="flex items-stretch gap-2 rounded-2xl border border-white/[0.08] bg-gvc-dark/90 px-2 py-2 shadow-lg backdrop-blur-md card-glow sm:px-3">
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 pl-1">
          <p className="truncate font-body text-[9px] font-semibold uppercase tracking-widest text-white/45">{levelLabel}</p>
          <motion.p
            key={score}
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 520, damping: 24 }}
            className="font-display text-xl font-black leading-none text-gvc-gold sm:text-2xl"
          >
            {score}
          </motion.p>
          <p className="font-body text-[9px] uppercase tracking-wide text-white/35">Score</p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-black/35 px-3 py-1">
          <p className="font-display text-xl font-black leading-none text-white sm:text-2xl">{shotsLeft}</p>
          <p className="mt-0.5 font-body text-[9px] uppercase tracking-wide text-white/40">Shots</p>
        </div>
        <div className="flex flex-col items-center justify-center gap-0.5 rounded-xl border border-white/[0.06] bg-black/30 px-2 py-1">
          <span className="font-display text-[8px] font-bold uppercase tracking-widest text-gvc-gold/80">Vibe</span>
          <div className="relative h-11 w-11 overflow-hidden rounded-full border border-gvc-gold/35 bg-[#0a0a0a] shadow-[0_0_12px_rgba(255,224,72,0.15)]">
            {projectileIsProceduralGold ? (
              <span
                className="absolute inset-0 block rounded-full"
                style={{
                  background: "radial-gradient(circle at 30% 30%, #fff8c8, #FFE048 45%, #6a5218)",
                }}
              />
            ) : projectileIsProceduralBadge ? (
              <span className="absolute inset-0 flex items-center justify-center font-display text-[10px] font-black text-gvc-gold">
                GVC
              </span>
            ) : projectilePreviewSrc ? (
              <Image src={projectilePreviewSrc} alt="" fill className="object-cover" sizes="44px" unoptimized />
            ) : (
              <Image src="/shaka.png" alt="" fill className="object-cover" sizes="44px" />
            )}
          </div>
        </div>
        <div className="flex items-center pr-0.5">
          <button
            type="button"
            onClick={() => {
              click();
              onOpenLeaderboard();
            }}
            className="flex h-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-white/10 text-white/70 transition hover:border-gvc-gold/35 hover:text-gvc-gold"
            aria-label="Leaderboard"
          >
            <Trophy className="h-5 w-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
