import { dailyEfficiencyBonus } from "./shiftScoring";

import { DAILY_MOVE_BUDGET } from "./shiftConfig";



export function dailyMovesRemaining(movesUsed: number): number {

  return Math.max(0, DAILY_MOVE_BUDGET - movesUsed);

}



export function computeDailyFinalScore(score: number, movesUsed: number): number {

  return score + dailyEfficiencyBonus(dailyMovesRemaining(movesUsed));

}


