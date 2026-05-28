import { CRASHERS_GAME_ID, type GameId } from "@/lib/games/catalog";
import { MERGE_GAME_ID } from "@/lib/vibe-merge/mergeConfig";
import { GARDEN_GAME_ID } from "@/lib/vibe-garden/gardenConfig";
import { CATCH_GAME_ID } from "@/lib/catch-a-vibe/catchConfig";

export function validateArcadeMovesMetadata(input: {
  gameId: string;
  mode: string;
  score: number;
  movesJson: string;
  shotsUsed?: number;
}): { ok: true } | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input.movesJson);
  } catch {
    return { ok: false, error: "Invalid move history." };
  }

  if (typeof parsed !== "object" || parsed === null) {
    return { ok: false, error: "Invalid move history." };
  }

  const obj = parsed as Record<string, unknown>;

  switch (input.gameId as GameId) {
    case MERGE_GAME_ID: {
      const merges = Number(obj.merges);
      const highestTier = Number(obj.highestTier);
      if (!Number.isFinite(merges) || merges < 0 || merges > 50_000) {
        return { ok: false, error: "Invalid merge count in move history." };
      }
      if (!Number.isFinite(highestTier) || highestTier < 1 || highestTier > 10) {
        return { ok: false, error: "Invalid tier in move history." };
      }
      const minScoreFromMerges = merges * 10;
      if (input.score > merges * 25_000 + 100_000) {
        return { ok: false, error: "Score inconsistent with merge history." };
      }
      if (merges > 0 && input.score < minScoreFromMerges * 0.5) {
        return { ok: false, error: "Score inconsistent with merge history." };
      }
      return { ok: true };
    }
    case GARDEN_GAME_ID: {
      const plants = Number(obj.plants ?? obj.totalPlants);
      const blooms = Number(obj.blooms ?? obj.maxBloomChain ?? 0);
      if (!Number.isFinite(plants) || plants < 0 || plants > 5_000) {
        return { ok: false, error: "Invalid plant count in move history." };
      }
      if (!Number.isFinite(blooms) || blooms < 0 || blooms > 100) {
        return { ok: false, error: "Invalid bloom data in move history." };
      }
      if (input.score > plants * 2_000 + blooms * 50_000) {
        return { ok: false, error: "Score inconsistent with garden history." };
      }
      return { ok: true };
    }
    case CATCH_GAME_ID: {
      const catches = Number(obj.catches ?? obj.totalCatches);
      const combo = Number(obj.maxCombo ?? obj.combo ?? 0);
      if (!Number.isFinite(catches) || catches < 0 || catches > 5_000) {
        return { ok: false, error: "Invalid catch count in move history." };
      }
      if (!Number.isFinite(combo) || combo < 0 || combo > 500) {
        return { ok: false, error: "Invalid combo in move history." };
      }
      if (input.score > catches * 500 + combo * 10_000) {
        return { ok: false, error: "Score inconsistent with catch history." };
      }
      return { ok: true };
    }
    case CRASHERS_GAME_ID: {
      const shots = obj.shots;
      if (!Array.isArray(shots)) return { ok: true };
      if (shots.length > 200) return { ok: false, error: "Too many shots in move history." };
      if (typeof input.shotsUsed === "number" && shots.length > input.shotsUsed + 2) {
        return { ok: false, error: "Shot history exceeds shots used." };
      }
      for (const s of shots) {
        if (typeof s !== "object" || s === null) continue;
        const row = s as Record<string, unknown>;
        for (const key of ["vx", "vy", "pull"]) {
          const n = Number(row[key]);
          if (row[key] !== undefined && (!Number.isFinite(n) || Math.abs(n) > 500)) {
            return { ok: false, error: "Invalid shot data in move history." };
          }
        }
      }
      return { ok: true };
    }
    default:
      return { ok: true };
  }
}
