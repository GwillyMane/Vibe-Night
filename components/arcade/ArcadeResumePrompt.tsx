"use client";

import { playUiClick } from "@/lib/sounds";

export function ArcadeResumePrompt({
  label,
  detail,
  muted,
  onResume,
  onDiscard,
}: {
  label: string;
  detail?: string;
  muted: boolean;
  onResume: () => void;
  onDiscard: () => void;
}) {
  return (
    <div className="rounded-2xl border border-gvc-gold/25 bg-black/50 p-4 text-left card-glow">
      <p className="font-display text-xs font-bold uppercase tracking-widest text-gvc-gold">Resume run?</p>
      {detail ? <p className="mt-1 font-body text-xs text-white/55">{detail}</p> : null}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => {
            playUiClick(muted);
            onResume();
          }}
          className="min-h-[44px] flex-1 rounded-xl bg-gvc-gold font-display text-xs font-black uppercase text-gvc-black"
        >
          {label}
        </button>
        <button
          type="button"
          onClick={() => {
            playUiClick(muted);
            onDiscard();
          }}
          className="min-h-[44px] rounded-xl border border-white/12 px-4 font-display text-xs font-bold uppercase text-white/60"
        >
          Discard
        </button>
      </div>
    </div>
  );
}
