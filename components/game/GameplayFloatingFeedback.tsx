"use client";

import { motion, AnimatePresence } from "framer-motion";
import { WORLD } from "@/lib/levels";

export type FloatKind = "pop" | "hero";

export interface HudFloatItem {
  id: string;
  text: string;
  /** Matter world X */
  wx: number;
  /** Matter world Y */
  wy: number;
  kind: FloatKind;
}

interface GameplayFloatingFeedbackProps {
  items: HudFloatItem[];
  reducedMotion: boolean;
}

export function GameplayFloatingFeedback({ items, reducedMotion }: GameplayFloatingFeedbackProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
      <AnimatePresence>
        {items.map((f) => (
          <motion.div
            key={f.id}
            initial={{ opacity: 0, y: 10, scale: f.kind === "hero" ? 0.92 : 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -28, scale: 0.98 }}
            transition={{ duration: reducedMotion ? 0.12 : 0.28, ease: "easeOut" }}
            className={
              f.kind === "hero"
                ? "absolute left-1/2 top-[14%] w-[88%] max-w-sm -translate-x-1/2 text-center font-display text-sm font-black uppercase tracking-wide text-gvc-gold drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]"
                : "absolute max-w-[min(200px,46%)] text-center font-display text-[11px] font-bold uppercase leading-tight tracking-wide text-gvc-gold drop-shadow-[0_1px_8px_rgba(0,0,0,0.95)]"
            }
            style={
              f.kind === "hero"
                ? undefined
                : {
                    left: `${(f.wx / WORLD.width) * 100}%`,
                    top: `${(f.wy / WORLD.height) * 100}%`,
                    transform: "translate(-50%, -50%)",
                  }
            }
          >
            <span className="rounded-lg border border-gvc-gold/35 bg-black/55 px-2 py-1 backdrop-blur-sm">{f.text}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
