import { CATCH_LEVEL_ID, MAX_RUN_MS } from "./catchConfig";

const MAX_CATCH_SCORE = 600_000;

export function validateCatchScorePayload(input: {
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
  if (input.levelId !== CATCH_LEVEL_ID) {
    return { ok: false, error: "Unknown level" };
  }
  if (input.mode === "daily" && (!input.seed || input.seed.length < 3)) {
    return { ok: false, error: "Daily mode requires seed" };
  }
  if (!Number.isFinite(input.score) || input.score < 1 || input.score > MAX_CATCH_SCORE) {
    return { ok: false, error: "Invalid score" };
  }
  if (!Number.isInteger(input.stars) || input.stars < 0 || input.stars > 3) {
    return { ok: false, error: "Invalid stars" };
  }
  if (!Number.isInteger(input.shotsUsed) || input.shotsUsed < 0 || input.shotsUsed > 2000) {
    return { ok: false, error: "Invalid catches count" };
  }
  return { ok: true };
}

export function maxPlausibleScore(survivalMs: number, catches: number): number {
  const sec = Math.min(survivalMs / 1000, MAX_RUN_MS / 1000);
  const rate = catches * 12 + sec * 50;
  return Math.min(MAX_CATCH_SCORE, Math.floor(rate * 18));
}
