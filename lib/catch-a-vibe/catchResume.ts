import type { ComboState } from "./catchCombo";
import type { CatchRunState } from "./catchPressure";
import type { CatchVibe } from "./catchEntities";
import type { SpawnScheduler } from "./catchSpawn";

const KEY = "catch-a-vibe:resume";

export type CatchResumeMode = "classic" | "daily" | "zen";

export interface CatchResumeSnapshot {
  version: 1;
  savedAt: number;
  mode: CatchResumeMode;
  dailySeed: string;
  runSeed: string;
  runStart: number;
  elapsedMs: number;
  score: number;
  combo: number;
  maxCombo: number;
  comboState: ComboState;
  bloomChains: number;
  goldenCatches: number;
  survivalAcc: number;
  run: CatchRunState;
  entities: CatchVibe[];
  spawn: Pick<SpawnScheduler, "nextSpawnAt" | "intervalMs" | "startInterval">;
}

export function saveCatchResume(snapshot: CatchResumeSnapshot | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!snapshot) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, JSON.stringify(snapshot));
  } catch {
    /* ignore */
  }
}

export function loadCatchResumeSnapshot(): CatchResumeSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CatchResumeSnapshot;
    if (parsed.version !== 1) return null;
    if (Date.now() - parsed.savedAt > 1000 * 60 * 60 * 48) {
      localStorage.removeItem(KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function catchResumeDetail(snap: CatchResumeSnapshot): string {
  return `${snap.mode === "daily" ? "Daily" : snap.mode === "zen" ? "Zen" : "Classic"} · ${snap.score.toLocaleString()} pts`;
}
