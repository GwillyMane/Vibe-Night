"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { VIBE_NIGHT } from "@/lib/brand";
import { NightStreakPill } from "./NightStreakPill";

export function LibraryHero() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="relative mx-auto mb-10 w-full max-w-2xl sm:mb-12"
    >
      <div className="relative overflow-hidden rounded-3xl border border-gvc-gold/25 bg-[#0a0a0a]/96 px-5 py-8 shadow-[0_0_80px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md sm:px-8 sm:py-10">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,224,72,0.08)_0%,transparent_55%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30"
          aria-hidden
        />

        <div className="relative z-10 flex flex-col items-center text-center">
          <Image
            src="/gvc-logotype.svg"
            alt="Good Vibes Club"
            width={200}
            height={32}
            className="h-4 w-auto opacity-90 sm:h-[18px]"
            priority
          />

          <p className="mt-5 font-display text-[10px] font-bold uppercase tracking-[0.4em] text-white/45">
            Arcade hub
          </p>

          <h1 className="mt-2 font-display text-[clamp(2.25rem,8vw,3.5rem)] font-black uppercase leading-[0.95] tracking-tight text-shimmer drop-shadow-[0_2px_24px_rgba(0,0,0,0.9)]">
            {VIBE_NIGHT.name}
          </h1>

          <p className="mx-auto mt-4 max-w-md font-body text-sm leading-relaxed text-white/78 sm:text-[15px]">
            {VIBE_NIGHT.libraryHeroLine}
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <NightStreakPill />
          </div>
        </div>
      </div>
    </motion.header>
  );
}
