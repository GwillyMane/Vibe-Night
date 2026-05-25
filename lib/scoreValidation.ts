import { HANDCRAFTED_LEVELS } from "./handcrafted-levels-data";
import {
  BONUS_PER_REMAINING_SHOT,
  COMBO_EXTRA_TARGET,
  SCORE_BLOCK,
  SCORE_FRAGILE_BREAK,
  SCORE_TARGET,
  SCORE_UNDER_PAR,
} from "./scoring";

const KNOWN_LEVEL_IDS = new Set(HANDCRAFTED_LEVELS.map((l) => l.id));

export function isKnownLevelId(levelId: string): boolean {
  return KNOWN_LEVEL_IDS.has(levelId);
}

/** Generous upper bound so obvious cheats fail without full replay. */
export function maxPlausibleScoreForLevel(levelId: string): number {
  const level = HANDCRAFTED_LEVELS.find((l) => l.id === levelId);
  if (!level) return 50_000;
  const targets = level.targets?.length ?? 3;
  const shots = level.availableShots;
  const blocksBudget = 80;
  const maxComboExtra = Math.max(0, targets - 1);
  const targetPts = targets * SCORE_TARGET;
  const blockPts = blocksBudget * SCORE_BLOCK;
  const fragileHeadroom = 25 * SCORE_FRAGILE_BREAK;
  const comboHeadroom = maxComboExtra * COMBO_EXTRA_TARGET * 2;
  const shotBonus = shots * BONUS_PER_REMAINING_SHOT;
  const headroom = 4000;
  return targetPts + blockPts + fragileHeadroom + comboHeadroom + shotBonus + SCORE_UNDER_PAR + headroom;
}

export function validateScorePayload(input: {
  mode: string;
  levelId: string;
  seed?: string | null;
  score: number;
  stars: number;
  shotsUsed: number;
  shotsTotal: number;
}): { ok: true } | { ok: false; error: string } {
  if (input.mode !== "level" && input.mode !== "daily") {
    return { ok: false, error: "Invalid mode" };
  }
  if (!isKnownLevelId(input.levelId)) {
    return { ok: false, error: "Unknown level" };
  }
  if (input.mode === "daily" && (!input.seed || typeof input.seed !== "string" || input.seed.length < 3)) {
    return { ok: false, error: "Daily mode requires seed" };
  }
  if (!Number.isFinite(input.score) || input.score < 1 || input.score > maxPlausibleScoreForLevel(input.levelId)) {
    return { ok: false, error: "Invalid score" };
  }
  if (!Number.isInteger(input.stars) || input.stars < 0 || input.stars > 3) {
    return { ok: false, error: "Invalid stars" };
  }
  if (!Number.isInteger(input.shotsUsed) || input.shotsUsed < 0) {
    return { ok: false, error: "Invalid shots used" };
  }
  if (!Number.isInteger(input.shotsTotal) || input.shotsTotal < 1 || input.shotsUsed > input.shotsTotal) {
    return { ok: false, error: "Invalid shots total" };
  }
  return { ok: true };
}
