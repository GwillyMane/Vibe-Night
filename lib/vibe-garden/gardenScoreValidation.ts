import { DAILY_RUN_MS, GARDEN_LEVEL_ID } from "./gardenConfig";

const MAX_GARDEN_SCORE = 500_000;

export function validateGardenScorePayload(input: {
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
  if (input.levelId !== GARDEN_LEVEL_ID) {
    return { ok: false, error: "Unknown level" };
  }
  if (input.mode === "daily" && (!input.seed || input.seed.length < 3)) {
    return { ok: false, error: "Daily mode requires seed" };
  }
  if (!Number.isFinite(input.score) || input.score < 1 || input.score > MAX_GARDEN_SCORE) {
    return { ok: false, error: "Invalid score" };
  }
  if (!Number.isInteger(input.stars) || input.stars < 0 || input.stars > 3) {
    return { ok: false, error: "Invalid stars" };
  }
  if (!Number.isInteger(input.shotsUsed) || input.shotsUsed < 0 || input.shotsUsed > 500) {
    return { ok: false, error: "Invalid plants count" };
  }
  return { ok: true };
}

export function maxPlausibleScore(survivalMs: number, plants: number): number {
  const sec = Math.min(survivalMs / 1000, DAILY_RUN_MS / 1000 + 60);
  const bloomRate = plants * 8 + sec * 40;
  return Math.min(MAX_GARDEN_SCORE, Math.floor(bloomRate * 15));
}
