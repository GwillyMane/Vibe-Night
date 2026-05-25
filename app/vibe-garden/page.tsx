"use client";

import Link from "next/link";
import { VIBE_NIGHT } from "@/lib/brand";
import VibeGardenClientGate from "@/components/game/VibeGardenClientGate";

/** Deep link: /vibe-garden launches Vibe Garden directly. */
export default function VibeGardenPage() {
  return (
    <main className="relative min-h-[100dvh]">
      <Link
        href="/"
        className="fixed left-3 top-3 z-[60] rounded-xl border border-gvc-gold/35 bg-black/75 px-3 py-2 font-display text-[10px] font-bold uppercase tracking-widest text-gvc-gold shadow-lg backdrop-blur-md sm:left-4 sm:top-4 sm:text-xs"
      >
        ← {VIBE_NIGHT.shortName}
      </Link>
      <VibeGardenClientGate />
    </main>
  );
}
