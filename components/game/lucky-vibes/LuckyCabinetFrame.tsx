"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function LuckyCabinetFrame({
  children,
  featureLabel,
}: {
  children: ReactNode;
  featureLabel?: string | null;
}) {
  return (
    <div className="relative mx-auto w-full max-w-[640px]">
      <div className="pointer-events-none absolute -inset-1 rounded-[1.35rem] bg-gradient-to-br from-[#FFE04855] via-[#FF6B9D33] to-[#6B9DFF33] opacity-80 blur-sm" />
      <div className="relative overflow-hidden rounded-3xl border border-gvc-gold/30 bg-[#08080c]/90 p-2 shadow-[0_0_60px_rgba(255,224,72,0.12),inset_0_1px_0_rgba(255,255,255,0.06)]">
        <div className="flex items-center justify-between px-2 pb-2 pt-1">
          <p className="font-display text-[11px] font-black uppercase tracking-[0.35em] text-gvc-gold/80">Lucky Vibes</p>
          {featureLabel ? (
            <motion.span
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-full border border-pink-400/40 bg-pink-500/15 px-2.5 py-0.5 font-display text-[9px] font-bold uppercase tracking-widest text-pink-200"
            >
              {featureLabel}
            </motion.span>
          ) : (
            <span className="font-body text-[9px] uppercase tracking-widest text-white/25">1,024 ways</span>
          )}
        </div>

        <div className="relative aspect-square overflow-hidden rounded-2xl">
          <div className="pointer-events-none absolute inset-x-0 top-[38%] z-10 h-[20%] border-y border-gvc-gold/20 bg-gvc-gold/[0.04]" />
          <div className="pointer-events-none absolute inset-0 z-10 rounded-2xl shadow-[inset_0_0_40px_rgba(0,0,0,0.65)]" />
          {children}
        </div>

        <div className="pointer-events-none absolute left-3 top-3 h-4 w-4 rounded-tl-lg border-l-2 border-t-2 border-gvc-gold/50" />
        <div className="pointer-events-none absolute right-3 top-3 h-4 w-4 rounded-tr-lg border-r-2 border-t-2 border-gvc-gold/50" />
        <div className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 rounded-bl-lg border-b-2 border-l-2 border-gvc-gold/50" />
        <div className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 rounded-br-lg border-b-2 border-r-2 border-gvc-gold/50" />
      </div>
    </div>
  );
}
