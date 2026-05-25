"use client";

import Link from "next/link";
import VibeMergeClientGate from "@/components/game/VibeMergeClientGate";
import { VIBE_NIGHT } from "@/lib/brand";

/** Deep link: /vibe-merge launches Big Vibes directly. */
export default function VibeMergePage() {
  return (
    <main className="relative min-h-[100dvh] bg-transparent text-white">
      <div className="relative min-h-[100dvh]">
        <Link
          href="/"
          className="fixed left-3 top-3 z-[60] rounded-xl border border-gvc-gold/35 bg-black/75 px-3 py-2 font-display text-[10px] font-bold uppercase tracking-widest text-gvc-gold shadow-lg backdrop-blur-md sm:left-4 sm:top-4 sm:text-xs"
        >
          ← {VIBE_NIGHT.shortName}
        </Link>
        <VibeMergeClientGate />
      </div>
    </main>
  );
}
