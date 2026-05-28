import type { GardenColorId, GardenEntityState } from "./gardenConfig";
import type { GardenCorruptionState } from "./gardenCorruption";

export type GardenResumeMode = "classic" | "daily" | "zen";

const KEY = "vibe-garden:resume";

export interface GardenResumeSnapshot {
  version: 1;
  savedAt: number;
  mode: GardenResumeMode;
  dailySeed: string;
  runStart: number;
  elapsedMs: number;
  score: number;
  combo: number;
  maxCombo: number;
  plants: number;
  maxChain: number;
  cleanses: number;
  goldBlooms: number;
  corruption: GardenCorruptionState;
  queue: { index: number; colors: GardenColorId[] };
  nextColor: GardenColorId;
  entities: { x: number; y: number; colorId: GardenColorId; state: GardenEntityState }[];
  dailyEventIdx: number;
}

export function saveGardenResume(snapshot: GardenResumeSnapshot | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!snapshot) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, JSON.stringify(snapshot));
  } catch {
    /* ignore */
  }
}

export function loadGardenResumeSnapshot(): GardenResumeSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GardenResumeSnapshot;
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

export function gardenResumeDetail(snap: GardenResumeSnapshot): string {
  return `${snap.mode === "daily" ? "Daily" : snap.mode === "zen" ? "Zen" : "Classic"} · ${snap.score.toLocaleString()} pts`;
}
