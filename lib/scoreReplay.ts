import { MERGE_GAME_ID } from "@/lib/vibe-merge/mergeConfig";
import { GARDEN_GAME_ID } from "@/lib/vibe-garden/gardenConfig";
import { CATCH_GAME_ID } from "@/lib/catch-a-vibe/catchConfig";
import { SHIFT_GAME_ID } from "@/lib/vibe-shift/shiftConfig";
import { replayScore as replayShiftScore } from "@/lib/vibe-shift/shiftEngine";
import type { ShiftMode } from "@/lib/vibe-shift/shiftConfig";
import { LUCKY_GAME_ID } from "@/lib/lucky-vibes/luckyConfig";
import { replayScore as replayLuckyScore } from "@/lib/lucky-vibes/luckyEngine";
import type { LuckyMode } from "@/lib/lucky-vibes/luckyConfig";
import { computeDailyFinalScore } from "@/lib/vibe-shift/shiftDaily";

const REPLAY_GAMES = new Set<string>([SHIFT_GAME_ID, LUCKY_GAME_ID]);

export function scoreRequiresReplay(gameId: string): boolean {
  return REPLAY_GAMES.has(gameId);
}

export function verifyScoreReplay(input: {
  gameId: string;
  mode: string;
  score: number;
  seed?: string | null;
  runSeed?: string | null;
  movesJson?: string | null;
}): { ok: true } | { ok: false; error: string } {
  const { gameId, mode, score, seed, runSeed, movesJson } = input;

  if (!movesJson || movesJson.length < 2) {
    return { ok: false, error: "Move history required for leaderboard submission." };
  }

  if (gameId === SHIFT_GAME_ID) {
    if (mode !== "classic" && mode !== "daily") return { ok: false, error: "Invalid mode" };
    const replaySeed = mode === "daily" ? String(seed ?? "") : String(seed ?? runSeed ?? "");
    if (replaySeed.length < 3) return { ok: false, error: "Missing run seed." };
    const replayed = replayShiftScore(
      replaySeed,
      mode as ShiftMode,
      movesJson,
      mode === "classic" ? String(runSeed ?? seed ?? replaySeed) : undefined
    );
    if (replayed == null) return { ok: false, error: "Could not verify run." };
    const expected = mode === "daily" ? computeDailyFinalScore(replayed, countShiftMoves(movesJson)) : replayed;
    if (expected !== score) return { ok: false, error: "Score does not match verified replay." };
    return { ok: true };
  }

  if (gameId === LUCKY_GAME_ID) {
    if (mode !== "classic" && mode !== "daily") return { ok: false, error: "Invalid mode" };
    const replaySeed = String(seed ?? runSeed ?? "");
    if (mode === "daily" && replaySeed.length < 8) return { ok: false, error: "Missing daily run seed." };
    if (mode === "classic" && replaySeed.length < 8) return { ok: false, error: "Missing run seed." };
    const replayed = replayLuckyScore(replaySeed, mode as LuckyMode, movesJson);
    if (replayed == null) return { ok: false, error: "Could not verify run." };
    if (replayed !== score) return { ok: false, error: "Score does not match verified replay." };
    return { ok: true };
  }

  if (gameId === MERGE_GAME_ID || gameId === GARDEN_GAME_ID || gameId === CATCH_GAME_ID) {
    try {
      JSON.parse(movesJson);
    } catch {
      return { ok: false, error: "Invalid move history." };
    }
    return { ok: true };
  }

  try {
    JSON.parse(movesJson);
  } catch {
    return { ok: false, error: "Invalid move history." };
  }
  return { ok: true };
}

function countShiftMoves(movesJson: string): number {
  try {
    const parsed = JSON.parse(movesJson) as Array<{ reverted?: boolean }>;
    return parsed.filter((m) => !m.reverted).length;
  } catch {
    return 0;
  }
}
