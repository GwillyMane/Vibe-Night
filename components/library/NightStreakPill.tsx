"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getNightStreak } from "@/lib/arcade/nightStreak";

export function NightStreakPill() {
  const { profile, user } = useAuth();
  const [localStreak, setLocalStreak] = useState(0);

  useEffect(() => {
    if (profile?.streak) return;
    setLocalStreak(getNightStreak().currentStreak);
  }, [profile]);

  const streak = user && profile ? profile.streak.currentStreak : localStreak;

  if (streak < 1) return null;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-gvc-gold/35 bg-black/60 px-3 py-1.5 font-display text-[10px] font-bold uppercase tracking-wider text-gvc-gold backdrop-blur-sm">
      <span aria-hidden>🔥</span>
      {streak}-day streak
    </span>
  );
}
