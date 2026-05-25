"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Flame, Medal, Sparkles, Star, Trophy, Zap } from "lucide-react";
import { PROFILE_BODY, PROFILE_CARD, PROFILE_MUTED } from "@/lib/profile/profileStyles";
import type { ActivityItem } from "@/lib/profile/types";
import { activityAccentClass, activityLabel, formatActivityTime } from "@/lib/profile/profileUi";

function ActivityIcon({ kind }: { kind: string }) {
  const className = "h-4 w-4 shrink-0";
  switch (kind) {
    case "streak_milestone":
      return <Flame className={className} aria-hidden />;
    case "achievement_unlock":
      return <Medal className={className} aria-hidden />;
    case "title_unlock":
      return <Sparkles className={className} aria-hidden />;
    case "leaderboard_top10":
      return <Trophy className={className} aria-hidden />;
    case "personal_best":
      return <Zap className={className} aria-hidden />;
    case "first_daily_win":
      return <Star className={className} aria-hidden />;
    default:
      return <Sparkles className={className} aria-hidden />;
  }
}

export function ProfileActivityFeed({ items }: { items: ActivityItem[] }) {
  const reduced = useReducedMotion();

  if (!items.length) {
    return (
      <p className={`px-4 py-8 text-center ${PROFILE_BODY} ${PROFILE_CARD}`}>
        No activity yet — play a daily run to start your feed.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <motion.li
          key={item.id}
          initial={reduced ? false : { opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.04 }}
          className={`group flex gap-3 px-3.5 py-3.5 transition hover:border-gvc-gold/30 ${PROFILE_CARD}`}
        >
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${activityAccentClass(item.kind)}`}
          >
            <ActivityIcon kind={item.kind} />
          </span>
          <div className="min-w-0 flex-1">
            <p className={PROFILE_BODY}>{activityLabel(item)}</p>
            <p className={`mt-1.5 uppercase tracking-wide ${PROFILE_MUTED}`}>{formatActivityTime(item.createdAt)}</p>
          </div>
        </motion.li>
      ))}
    </ul>
  );
}
