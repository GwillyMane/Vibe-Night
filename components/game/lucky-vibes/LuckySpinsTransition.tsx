"use client";

import { AnimatePresence, motion } from "framer-motion";

export type LuckySpinsTransitionPhase = "enter" | "exit" | null;

export function LuckySpinsTransition({
  phase,
  freeSpins,
  totalWin,
}: {
  phase: LuckySpinsTransitionPhase;
  freeSpins?: number;
  totalWin?: number;
}) {
  if (!phase) return null;

  const entering = phase === "enter";

  return (
    <AnimatePresence>
      <motion.div
        key={phase}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
        className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: entering ? 0.85 : 0.7 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,107,157,0.35)_0%,rgba(5,5,5,0.92)_65%)]"
        />

        <motion.div
          initial={{ scale: 0.4, y: 40, rotate: -6 }}
          animate={{ scale: 1, y: 0, rotate: 0 }}
          exit={{ scale: 0.85, y: -30, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          className="relative text-center px-6"
        >
          {entering ? (
            <>
              <motion.p
                className="font-display text-sm font-bold uppercase tracking-[0.45em] text-pink-200/80"
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ repeat: Infinity, duration: 1.4 }}
              >
                Feature unlocked
              </motion.p>
              <motion.h2
                className="mt-2 font-display text-5xl font-black uppercase text-shimmer sm:text-6xl"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 0.9 }}
              >
                Lucky Spins
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="mt-4 font-display text-2xl font-black text-white"
              >
                {freeSpins ?? 10} FREE SPINS
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="mt-2 font-body text-sm text-pink-100/70"
              >
                Expanding reels · Rising multiplier · Premium boost
              </motion.p>
            </>
          ) : (
            <>
              <p className="font-display text-sm font-bold uppercase tracking-[0.4em] text-gvc-gold/70">
                Lucky Spins complete
              </p>
              <h2 className="mt-2 font-display text-4xl font-black uppercase text-white sm:text-5xl">Nice run!</h2>
              {totalWin != null && totalWin > 0 ? (
                <p className="mt-4 font-display text-3xl font-black tabular-nums text-gvc-gold">
                  +{totalWin.toLocaleString()}
                </p>
              ) : null}
            </>
          )}
        </motion.div>

        {entering ? (
          <motion.div
            className="pointer-events-none absolute inset-0 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {Array.from({ length: 24 }).map((_, i) => (
              <motion.span
                key={i}
                className="absolute h-1 w-1 rounded-full bg-gvc-gold"
                style={{ left: `${(i * 17) % 100}%`, top: `${(i * 23) % 100}%` }}
                animate={{ y: [0, -120], opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 1.2 + (i % 5) * 0.15, delay: i * 0.05 }}
              />
            ))}
          </motion.div>
        ) : null}
      </motion.div>
    </AnimatePresence>
  );
}
