"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Award, Sparkles, Trophy } from "lucide-react";
import { PROFILE_CHIP, PROFILE_LABEL, PROFILE_TEXT_SHADOW } from "@/lib/profile/profileStyles";
import type { PublicProfile } from "@/lib/profile/types";

interface ProfileIdentityBarProps {
  profile: PublicProfile;
}

export function ProfileIdentityBar({ profile }: ProfileIdentityBarProps) {
  const reduced = useReducedMotion();

  const chips = [
    {
      icon: Trophy,
      label: "Achievements",
      value: profile.achievementCount.toString(),
      valueClass: "text-gvc-gold",
      iconClass: "text-gvc-gold",
    },
    {
      icon: Award,
      label: "Arcade tier",
      value: profile.arcadeTier,
      valueClass: "text-[#f5f5f5]",
      iconClass: "text-[#c4c4c4]",
    },
    {
      icon: Sparkles,
      label: "Vibe rank",
      value: `#${profile.vibeRank.toLocaleString()}`,
      valueClass: "text-[#FF6B9D]",
      iconClass: "text-[#FF6B9D]",
    },
  ];

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.08 }}
      className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none]"
    >
      {chips.map(({ icon: Icon, label, value, valueClass, iconClass }) => (
        <div key={label} className={`flex min-w-[8rem] shrink-0 flex-col px-3.5 py-3 ${PROFILE_CHIP}`}>
          <span className={`flex items-center gap-1.5 ${PROFILE_LABEL}`}>
            <Icon className={`h-3.5 w-3.5 ${iconClass}`} aria-hidden />
            {label}
          </span>
          <span className={`mt-1.5 font-display text-base font-bold ${valueClass} ${PROFILE_TEXT_SHADOW}`}>
            {value}
          </span>
        </div>
      ))}
    </motion.div>
  );
}
