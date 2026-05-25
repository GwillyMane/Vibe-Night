"use client";

import { playUiClick } from "@/lib/sounds";
import type { PhysicsLevelDefinition } from "@/lib/levels";

export interface DailyCrashPanelProps {
  dailySeedPreview: string;
  dailyLevel: PhysicsLevelDefinition | undefined;
  bestDaily: number;
  streak: number;
  muted: boolean;
  onPlayDaily: () => void;
  /** Larger hero card on title screen */
  hero?: boolean;
}

export function DailyCrashPanel({
  dailySeedPreview,
  dailyLevel,
  bestDaily,
  streak,
  muted,
  onPlayDaily,
  hero,
}: DailyCrashPanelProps) {
  const c = () => playUiClick(muted);
  return (
    <div
      className={`relative z-10 overflow-hidden rounded-2xl border border-pink-accent/30 bg-[#0a0a0a] p-4 text-left shadow-[0_0_40px_rgba(255,107,157,0.12)] ${
        hero ? "card-glow" : ""
      }`}
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gvc-gold/10 blur-2xl" />
      <p className="font-display text-[10px] font-bold uppercase tracking-[0.28em] text-pink-accent/90">Today&apos;s crash</p>
      <p className="mt-1 font-display text-lg font-black uppercase leading-tight text-shimmer">{dailyLevel?.name ?? "—"}</p>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-body text-[11px] text-white/65">
        <span>
          Seed <span className="font-mono text-gvc-gold/90">{dailySeedPreview}</span>
        </span>
        {dailyLevel ? (
          <span>
            Rank <span className="text-white/70">{dailyLevel.difficulty}</span>
          </span>
        ) : null}
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
        Play daily crash
      </button>
    </div>
  );
}
