export const SCORE_TARGET = 520;
export const SCORE_BLOCK = 45;
export const SCORE_FRAGILE_BREAK = 65;
export const BONUS_PER_REMAINING_SHOT = 110;
export const COMBO_EXTRA_TARGET = 180;
export const SCORE_UNDER_PAR = 140;
export const SCORE_COLLAPSE_COMBO = 40;

export interface ScoreSnapshot {
  targetPoints: number;
  blockPoints: number;
  comboBonus: number;
  shotBonus: number;
  total: number;
  stars: 1 | 2 | 3;
}

export function comboBonusForTargets(clearedInOneLaunch: number): number {
  if (clearedInOneLaunch <= 1) return 0;
  return (clearedInOneLaunch - 1) * COMBO_EXTRA_TARGET;
}

export function computeLevelTotal(params: {
  targetsCleared: number;
  blocksDestroyed: number;
  maxComboTargetsSingleLaunch: number;
  shotsRemainingAfterWin: number;
}): Omit<ScoreSnapshot, "stars"> {
  const targetPoints = params.targetsCleared * SCORE_TARGET;
  const blockPoints = params.blocksDestroyed * SCORE_BLOCK;
  const comboBonus = comboBonusForTargets(params.maxComboTargetsSingleLaunch);
  const shotBonus = Math.max(0, params.shotsRemainingAfterWin) * BONUS_PER_REMAINING_SHOT;
  const total = targetPoints + blockPoints + comboBonus + shotBonus;
  return { targetPoints, blockPoints, comboBonus, shotBonus, total };
}

/** Fallback star curve when a level has no explicit thresholds. */
export function starsFromScore(total: number, targetsInLevel: number): 1 | 2 | 3 {
  const softCap =
    targetsInLevel * SCORE_TARGET +
    18 * SCORE_BLOCK +
    2 * COMBO_EXTRA_TARGET +
    3 * BONUS_PER_REMAINING_SHOT;
  const r = total / Math.max(softCap * 0.55, 1);
  if (r >= 1.05) return 3;
  if (r >= 0.72) return 2;
  return 1;
}

export function starsFromThresholds(total: number, twoStarsMin: number, threeStarsMin: number): 1 | 2 | 3 {
  if (total >= threeStarsMin) return 3;
  if (total >= twoStarsMin) return 2;
  return 1;
}

export function finalizeScore(
  base: Omit<ScoreSnapshot, "stars">,
  targetsInLevel: number,
  starThresholds?: { twoStarsMin: number; threeStarsMin: number }
): ScoreSnapshot {
  const stars = starThresholds
    ? starsFromThresholds(base.total, starThresholds.twoStarsMin, starThresholds.threeStarsMin)
    : starsFromScore(base.total, targetsInLevel);
  return { ...base, stars };
}
