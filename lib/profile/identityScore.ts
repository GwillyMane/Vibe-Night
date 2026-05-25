import type { ArcadeTier } from "./catalog";

export interface IdentityInput {
  achievementCount: number;
  currentStreak: number;
  gamesWithScores: number;
  totalArcadeScore: number;
  legendaryMoments: number;
}

const ACHIEVEMENT_CAP = 40;
const STREAK_CAP = 25;
const DIVERSITY_CAP = 20;
const HIGHLIGHTS_CAP = 15;

export function computeVibeRank(input: IdentityInput): number {
  const ach = Math.min(ACHIEVEMENT_CAP, Math.floor(input.achievementCount * 2.5));
  const streak = Math.min(STREAK_CAP, Math.min(input.currentStreak * 3, STREAK_CAP));
  const diversity = Math.min(DIVERSITY_CAP, input.gamesWithScores * 5);
  const highlights = Math.min(
    HIGHLIGHTS_CAP,
    Math.floor(input.totalArcadeScore / 50_000) + input.legendaryMoments * 3
  );
  return Math.min(100, ach + streak + diversity + highlights);
}

export function vibeRankToTier(rank: number): ArcadeTier {
  if (rank >= 75) return "Legend";
  if (rank >= 50) return "Crusher";
  if (rank >= 25) return "Regular";
  return "Rookie";
}

export function computeIdentity(input: IdentityInput): { vibeRank: number; arcadeTier: ArcadeTier } {
  const vibeRank = computeVibeRank(input);
  return { vibeRank, arcadeTier: vibeRankToTier(vibeRank) };
}
