import { useCallback } from "react";

export interface SubmitArcadeScorePayload {
  gameId: string;
  mode: string;
  levelId: string;
  seed?: string | null;
  runSeed?: string;
  score: number;
  stars?: number;
  shotsUsed?: number;
  shotsTotal?: number;
  won?: boolean;
  moves_json?: string;
  run_hash?: string;
  client_version?: string;
}

export interface SubmitArcadeScoreResult {
  rank: number | null;
  error?: string;
}

export async function submitArcadeScore(
  payload: SubmitArcadeScorePayload
): Promise<SubmitArcadeScoreResult> {
  try {
    const res = await fetch("/api/scores", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      return { rank: null, error: data.error ?? "Could not submit score." };
    }
    const data = (await res.json()) as { rank?: number | null };
    return { rank: data.rank ?? null };
  } catch {
    return { rank: null, error: "Could not submit score." };
  }
}

/** Stable submit helper for end-of-run score POST. */
export function usePostRun() {
  const submitScore = useCallback(
    (payload: SubmitArcadeScorePayload) => submitArcadeScore(payload),
    []
  );
  return { submitScore };
}
