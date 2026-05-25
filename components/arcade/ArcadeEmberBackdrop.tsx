"use client";

import { motion } from "framer-motion";

/** Floating gold embers shared across title screens and hub. */
export function ArcadeEmberBackdrop({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden rounded-3xl ${className}`}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <motion.span
          key={i}
          className="ember absolute rounded-full bg-gvc-gold/25 blur-[1px]"
          style={{
            width: 6 + (i % 3) * 4,
            height: 6 + (i % 3) * 4,
            left: `${8 + i * 15}%`,
            top: `${12 + (i % 4) * 18}%`,
          }}
          animate={{
            y: [0, -10, 0],
            x: [0, i % 2 === 0 ? 6 : -6, 0],
            opacity: [0.22, 0.5, 0.22],
          }}
          transition={{ duration: 5 + (i % 3), repeat: Infinity, ease: "easeInOut", delay: i * 0.35 }}
        />
      ))}
      <div className="absolute left-1/2 top-[8%] h-32 w-[120%] -translate-x-1/2 rounded-full bg-gvc-gold/[0.07] blur-3xl" />
    </div>
  );
}
