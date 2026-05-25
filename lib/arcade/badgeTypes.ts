import type { AchievementTier } from "@/lib/achievements";

export interface BadgeRow {
  slug: string;
  title: string;
  description: string;
  tier: AchievementTier;
  unlocked: boolean;
  current: number;
  target: number;
}
