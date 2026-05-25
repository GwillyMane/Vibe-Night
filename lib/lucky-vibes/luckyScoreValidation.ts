import {
  CLASSIC_SPIN_BUDGET,
  DAILY_SPIN_BUDGET,
  LUCKY_LEVEL_ID,
  MAX_SCORE,
} from "./luckyConfig";

const RUN_SEED_RE = /^(classic|daily|zen)-[\w-]{8,120}$/;

export function validateLuckyScorePayload(input: {
  mode: string;
  levelId: string;
  seed?: string | null;
  score: number;
  stars: number;
  shotsUsed: number;
  shotsTotal: number;
}): { ok: true } | { ok: false; error: string } {
  if (input.mode !== "classic" && input.mode !== "daily") {
    return { ok: false, error: "Invalid mode" };
  }
  if (input.levelId !== LUCKY_LEVEL_ID) {
    return { ok: false, error: "Unknown level" };
  }
  if (input.mode === "daily") {
    if (!input.seed || !RUN_SEED_RE.test(input.seed)) {
      return { ok: false, error: "Invalid daily run seed" };
    }
  }
  if (!Number.isFinite(input.score) || input.score < 1 || input.score > MAX_SCORE) {
    return { ok: false, error: "Invalid score" };
  }
  if (!Number.isInteger(input.stars) || input.stars < 0 || input.stars > 3) {
    return { ok: false, error: "Invalid stars" };
  }
  const maxShots = input.mode === "daily" ? DAILY_SPIN_BUDGET : CLASSIC_SPIN_BUDGET;
  if (!Number.isInteger(input.shotsUsed) || input.shotsUsed < 1 || input.shotsUsed > maxShots + 50) {
    return { ok: false, error: "Invalid spin count" };
  }
  return { ok: true };
}
