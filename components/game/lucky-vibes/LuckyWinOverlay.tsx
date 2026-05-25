"use client";

import { motion, AnimatePresence, animate } from "framer-motion";
import { useEffect, useState } from "react";
import type { WinTier } from "@/lib/lucky-vibes/luckyConfig";

const LABELS: Record<WinTier, string | null> = {
  none: null,
  nice: "NICE",
  super: "SUPER",
  big: "BIG WIN",
  mega: "MEGA WIN",
  legendary: "LEGENDARY",
};

const GLOW: Record<WinTier, string> = {
  none: "transparent",
  nice: "rgba(255,224,72,0.3)",
  super: "rgba(255,224,72,0.45)",
  big: "rgba(255,95,31,0.5)",
  mega: "rgba(255,107,157,0.55)",
  legendary: "rgba(180,120,255,0.65)",
};

function TickUpNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 0.9,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.floor(v)),
    });
    return () => controls.stop();
  }, [value]);

  return (
    <motion.span
      className="font-display text-4xl font-black tabular-nums text-white sm:text-5xl"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      +{display.toLocaleString()}
    </motion.span>
  );
}

export function LuckyWinOverlay({ tier, amount }: { tier: WinTier; amount: number }) {
  const label = LABELS[tier];
  if (!label) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: `radial-gradient(circle at center, ${GLOW[tier]} 0%, rgba(0,0,0,0.75) 70%)` }}
      >
        <motion.div
          initial={{ scale: 0.5, rotate: -8 }}
          animate={{ scale: [0.5, 1.12, 1], rotate: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="text-center"
        >
          <motion.p
            className="font-display text-5xl font-black uppercase tracking-wider text-shimmer drop-shadow-[0_0_24px_rgba(255,224,72,0.6)] sm:text-6xl"
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
          >
            {label}
          </motion.p>
          {amount > 0 ? (
            <div className="mt-3">
              <TickUpNumber value={amount} />
            </div>
          ) : null}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
