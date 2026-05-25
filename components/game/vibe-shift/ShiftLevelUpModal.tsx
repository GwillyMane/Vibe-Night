"use client";

import { motion } from "framer-motion";

export function ShiftLevelUpModal({ level, onContinue }: { level: number; onContinue: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm rounded-2xl border border-gvc-gold/40 bg-[#121212] p-6 text-center shadow-2xl"
      >
        <p className="font-display text-sm font-black uppercase tracking-widest text-gvc-gold">Level up</p>
        <h2 className="mt-2 font-display text-4xl font-black uppercase text-shimmer">Level {level}</h2>
        <p className="mt-2 font-body text-sm text-white/60">Fresh board. Keep shifting to hit the next target.</p>
        <button
          type="button"
          onClick={onContinue}
          className="mt-6 w-full rounded-xl bg-gvc-gold py-3 font-display text-sm font-black uppercase text-gvc-black"
        >
          Continue
        </button>
      </motion.div>
    </div>
  );
}
