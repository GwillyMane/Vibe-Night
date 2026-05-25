import { DAILY_MOVE_BUDGET, SHIFT_LEVEL_ID } from "./shiftConfig";

const MAX_SHIFT_SCORE = 200_000;

export function validateShiftScorePayload(input: {
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
  if (input.levelId !== SHIFT_LEVEL_ID) {
    return { ok: false, error: "Unknown level" };
  }
  if (input.mode === "daily" && (!input.seed || input.seed.length < 3)) {
    return { ok: false, error: "Daily mode requires seed" };
  }
  if (!Number.isFinite(input.score) || input.score < 1 || input.score > MAX_SHIFT_SCORE) {
    return { ok: false, error: "Invalid score" };
  }
  if (!Number.isInteger(input.stars) || input.stars < 0 || input.stars > 3) {
    return { ok: false, error: "Invalid stars" };
  }
  if (!Number.isInteger(input.shotsUsed) || input.shotsUsed < 0 || input.shotsUsed > DAILY_MOVE_BUDGET + 500) {
    return { ok: false, error: "Invalid moves count" };
  }
  return { ok: true };
}
