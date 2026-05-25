"use client";

import { motion, useReducedMotion } from "framer-motion";
import { PROFILE_CARD, PROFILE_LABEL, PROFILE_TEXT_SHADOW } from "@/lib/profile/profileStyles";
import type { ProfileStatChip } from "@/lib/profile/types";

interface ProfileStatsRowProps {
  stats: ProfileStatChip[];
}

export function ProfileStatsRow({ stats }: ProfileStatsRowProps) {
  const reduced = useReducedMotion();
  if (stats.length === 0) return null;

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.12 }}
      className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none]"
    >
      {stats.map((stat, i) => (
        <motion.div
          key={stat.id}
          initial={reduced ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 * i }}
          whileHover={reduced ? undefined : { y: -2 }}
          className={`shrink-0 px-4 py-3.5 min-w-[8.5rem] ${PROFILE_CARD}`}
        >
          <p className={PROFILE_LABEL}>{stat.label}</p>
          <p className={`mt-1.5 font-display text-xl font-bold text-gvc-gold ${PROFILE_TEXT_SHADOW}`}>
            {stat.value}
          </p>
        </motion.div>
      ))}
    </motion.div>
  );
}
