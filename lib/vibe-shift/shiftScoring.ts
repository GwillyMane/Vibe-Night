import {
  CASCADE_MULT_STEP,
  LINE_BONUS_4,
  LINE_BONUS_5,
  MAX_CASCADE_MULT,
  POINTS_PER_CELL,
  SQUARE_BONUS_2,
  SQUARE_BONUS_3,
} from "./shiftConfig";
import type { MatchGroup } from "./shiftMatch";

export function groupTypeBonus(group: MatchGroup): number {
  switch (group.kind) {
    case "line5":
      return LINE_BONUS_5;
    case "line4":
      return LINE_BONUS_4;
    case "square":
      return group.size >= 3 ? SQUARE_BONUS_3 : SQUARE_BONUS_2;
    default:
      return 0;
  }
}

export function scoreMatchGroups(groups: MatchGroup[], cascadeStep: number): number {
  const mult = Math.min(MAX_CASCADE_MULT, 1 + (cascadeStep - 1) * CASCADE_MULT_STEP);
  const unique = new Set<string>();
  for (const g of groups) {
    for (const { r, c } of g.coords) unique.add(`${r},${c}`);
  }
  let score = unique.size * POINTS_PER_CELL;
  for (const g of groups) score += groupTypeBonus(g);
  return Math.round(score * mult);
}

/** @deprecated use scoreMatchGroups */
export function scoreCascadeStep(cellCount: number, cascadeStep: number): number {
  const mult = Math.min(MAX_CASCADE_MULT, 1 + (cascadeStep - 1) * CASCADE_MULT_STEP);
  let bonus = 0;
  if (cellCount >= 5) bonus = LINE_BONUS_5;
  else if (cellCount >= 4) bonus = LINE_BONUS_4;
  return Math.round(cellCount * POINTS_PER_CELL * mult + bonus);
}

export function dailyEfficiencyBonus(unusedMoves: number): number {
  return unusedMoves * 15;
}

export function primaryMatchLabel(groups: MatchGroup[]): string {
  if (!groups.length) return "";
  const rank = (g: MatchGroup) => {
    if (g.kind === "line5") return 5;
    if (g.kind === "line4") return 4;
    if (g.kind === "square" && g.size >= 3) return 4;
    if (g.kind === "square") return 3;
    return 2;
  };
  return [...groups].sort((a, b) => rank(b) - rank(a))[0]!.label;
}
