import { DAILY_SPIN_BUDGET, SCATTER_TEASE_PTS, streakMultiplier, winTierForAmount, type WinTier } from "./luckyConfig";
import type { WayWin } from "./luckyWays";
import { totalWayPoints } from "./luckyWays";

export function applyStreakToWin(baseWin: number, streak: number): number {
  if (baseWin <= 0) return 0;
  return Math.floor(baseWin * streakMultiplier(streak));
}

export function nextStreak(current: number, hadWin: boolean): number {
  return hadWin ? current + 1 : 0;
}

export function dailyEfficiencyBonus(unusedSpins: number): number {
  return Math.floor(unusedSpins * 60);
}

export function computeDailyFinalScore(runScore: number, spinsUsed: number): number {
  const unused = Math.max(0, DAILY_SPIN_BUDGET - spinsUsed);
  return runScore + dailyEfficiencyBonus(unused);
}

export function scatterTeasePoints(scatterCount: number): number {
  return scatterCount * SCATTER_TEASE_PTS;
}

export interface SpinScoreResult {
  wayPoints: number;
  streakMult: number;
  spinTotal: number;
  tier: WinTier;
}

export function scoreSpin(wins: WayWin[], streak: number): SpinScoreResult {
  const wayPoints = totalWayPoints(wins);
  const streakMult = streakMultiplier(streak);
  const spinTotal = applyStreakToWin(wayPoints, streak);
  return { wayPoints, streakMult, spinTotal, tier: winTierForAmount(spinTotal) };
}
