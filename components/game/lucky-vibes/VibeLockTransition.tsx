"use client";

import { AnimatePresence, motion } from "framer-motion";

export type VibeLockTransitionPhase = "enter" | "exit" | null;

export function VibeLockTransition({
  phase,
  totalWin,
  grandVibe,
}: {
  phase: VibeLockTransitionPhase;
  totalWin?: number;
  grandVibe?: boolean;
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
          className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(96,165,250,0.35)_0%,rgba(5,5,5,0.92)_65%)]"
        />

        <motion.div
          initial={{ scale: 0.4, y: 40, rotate: 6 }}
          animate={{ scale: 1, y: 0, rotate: 0 }}
          exit={{ scale: 0.85, y: -30, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          className="relative px-6 text-center"
        >
          {entering ? (
            <>
              <motion.p
                className="font-display text-sm font-bold uppercase tracking-[0.45em] text-blue-200/80"
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ repeat: Infinity, duration: 1.4 }}
              >
                Craig spotted
              </motion.p>
              <motion.h2
                className="mt-2 font-display text-5xl font-black uppercase text-shimmer sm:text-6xl"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 0.9 }}
              >
                Vibe Lock
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="mt-4 font-display text-xl font-black text-white"
              >
                LOCK & RESPIN
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="mt-2 font-body text-sm text-blue-100/70"
              >
                Craig holds · empty cells respin for values
              </motion.p>
            </>
          ) : (
            <>
              <p className="font-display text-sm font-bold uppercase tracking-[0.4em] text-gvc-gold/70">
                Vibe Lock complete
              </p>
              {grandVibe ? (
                <motion.p
                  initial={{ scale: 0.8 }}
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ repeat: 2, duration: 0.5 }}
                  className="mt-3 font-display text-2xl font-black uppercase text-gvc-gold"
                >
                  Grand Vibe!
                </motion.p>
              ) : null}
              {totalWin != null && totalWin > 0 ? (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 font-display text-4xl font-black text-white"
                >
                  +{totalWin.toLocaleString()}
                </motion.p>
              ) : null}
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
