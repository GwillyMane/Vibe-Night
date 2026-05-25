"use client";

import type { ReactNode } from "react";
import { playUiClick } from "@/lib/sounds";

export interface ArcadeDailyHeroPanelProps {
  challengeLabel: string;
  headline: string;
  dailySeed: string;
  bestDaily: number;
  streak?: number;
  extraMeta?: ReactNode;
  playLabel?: string;
  muted: boolean;
  onPlayDaily: () => void;
}

export function ArcadeDailyHeroPanel({
  challengeLabel,
  headline,
  dailySeed,
  bestDaily,
  streak = 0,
  extraMeta,
  playLabel = "Play daily",
  muted,
  onPlayDaily,
}: ArcadeDailyHeroPanelProps) {
  const c = () => playUiClick(muted);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-pink-accent/30 bg-[#0a0a0a] p-4 text-left shadow-[0_0_40px_rgba(255,107,157,0.12)] card-glow">
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gvc-gold/10 blur-2xl" />
      <p className="font-display text-[10px] font-bold uppercase tracking-[0.28em] text-pink-accent/90">{challengeLabel}</p>
      <p className="mt-1 font-display text-lg font-black uppercase leading-tight text-shimmer">{headline}</p>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-body text-[11px] text-white/65">
        <span>
          Seed <span className="font-mono text-gvc-gold/90">{dailySeed}</span>
        </span>
        {extraMeta}
        <span>
          Best <span className="text-white/80">{bestDaily || "—"}</span>
        </span>
        {streak > 0 ? (
          <span>
            Streak <span className="text-gvc-green">{streak}</span>
          </span>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => {
          c();
          onPlayDaily();
        }}
        className="mt-4 flex min-h-[48px] w-full items-center justify-center rounded-xl bg-gvc-gold px-4 py-3 font-display text-sm font-black uppercase tracking-wide text-gvc-black shadow-[0_0_24px_rgba(255,224,72,0.25)] transition hover:shadow-[0_0_32px_rgba(255,224,72,0.4)] active:scale-[0.99]"
      >
        {playLabel}
      </button>
    </div>
  );
}
