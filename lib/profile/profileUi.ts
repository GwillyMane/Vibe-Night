import { urlForGoodVibeFaceSlug } from "@/lib/assets/gvcBrandFaces";
import { REWARD_BADGE_FALLBACK_SRC } from "@/lib/gvcRewardBadges";

export function avatarUrlForFaceId(faceId: string): string {
  if (faceId === "shaka") return "/shaka.png";
  const url = urlForGoodVibeFaceSlug(faceId);
  return url ?? "/shaka.png";
}

export function badgeImageUrl(key: string | null | undefined, resolver?: (k: string) => string | undefined): string {
  if (!key) return REWARD_BADGE_FALLBACK_SRC;
  return resolver?.(key) ?? REWARD_BADGE_FALLBACK_SRC;
}

export function formatJoinDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

export function formatActivityTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function activityLabel(item: { kind: string; payload: Record<string, unknown> }): string {
  const label = item.payload.label;
  if (typeof label === "string" && label) return label;
  switch (item.kind) {
    case "streak_milestone":
      return "Streak milestone reached";
    case "achievement_unlock":
      return "Achievement unlocked";
    case "title_unlock":
      return "New title unlocked";
    case "personal_best":
      return "New personal best";
    case "leaderboard_top10":
      return "Leaderboard climb";
    case "first_daily_win":
      return "Daily win";
    case "passport_generated":
      return "Passport generated";
    default:
      return "Arcade activity";
  }
}

export type ActivityKind =
  | "streak_milestone"
  | "achievement_unlock"
  | "title_unlock"
  | "personal_best"
  | "leaderboard_top10"
  | "first_daily_win"
  | string;

export function activityAccentClass(kind: ActivityKind): string {
  switch (kind) {
    case "streak_milestone":
      return "border-gvc-gold/40 bg-[#1a1608] text-gvc-gold";
    case "achievement_unlock":
    case "title_unlock":
      return "border-pink-accent/35 bg-[#1a0a12] text-[#FF6B9D]";
    case "leaderboard_top10":
      return "border-gvc-green/35 bg-[#0a1a0a] text-gvc-green";
    case "personal_best":
      return "border-gvc-gold/35 bg-[#1a1608] text-gvc-gold";
    default:
      return "border-[#333] bg-[#141414] text-[#c4c4c4]";
  }
}
