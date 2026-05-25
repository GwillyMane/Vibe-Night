"use client";

import { GameModal } from "../GameModal";
import { FEATURE_SYMBOL_NAMES, PAYTABLE, PREMIUM_TOKEN_IDS, TOKEN_DISPLAY_NAMES } from "@/lib/lucky-vibes/luckyConfig";

export function LuckyPaytableModal({
  open,
  onClose,
  muted,
}: {
  open: boolean;
  onClose: () => void;
  muted: boolean;
}) {
  return (
    <GameModal open={open} onClose={onClose} title="Paytable" muted={muted} tall>
      <div className="space-y-4 font-body text-sm text-white/75">
        <p>1,024 ways — match left to right on adjacent reels.</p>
        <ul className="list-inside list-disc space-y-1 text-xs">
          <li>3+ {FEATURE_SYMBOL_NAMES.scatter} → Lucky Spins</li>
          <li>4+ {FEATURE_SYMBOL_NAMES.orb} → Vibe Lock (hold & respin)</li>
          <li>Vibe Lock: Craig locks in place · empty cells roll for more Craig or blank</li>
          <li>Wild substitutes except {FEATURE_SYMBOL_NAMES.scatter} & {FEATURE_SYMBOL_NAMES.orb}</li>
        </ul>
        <div className="border-t border-white/10 pt-3">
          <p className="mb-2 font-display text-xs font-bold uppercase text-gvc-gold">Premium tokens</p>
          {PREMIUM_TOKEN_IDS.map((id) => (
            <p key={id} className="text-xs">
              {TOKEN_DISPLAY_NAMES[id]} · #{id}
            </p>
          ))}
        </div>
        <div className="border-t border-white/10 pt-3 text-xs opacity-80">
          {Object.entries(PAYTABLE)
            .slice(0, 5)
            .map(([sym, pts]) => (
              <p key={sym}>
                {sym}: 3={pts[3]} 4={pts[4]} 5={pts[5]} 6={pts[6]}
              </p>
            ))}
        </div>
      </div>
    </GameModal>
  );
}
