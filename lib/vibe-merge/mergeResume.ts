import type { MergeTierId } from "./mergeConfig";

const KEY = "vibe-merge:resume";

export interface MergeResumeSnapshot {
  version: 1;
  savedAt: number;
  mode: "classic" | "daily";
  dailySeed: string;
  queue: { index: number; tiers: MergeTierId[] };
  score: number;
  combo: number;
  maxCombo: number;
  mergeCount: number;
  highestTier: MergeTierId;
  holdingTier: MergeTierId | null;
  aimX: number;
  runStart: number;
  pieces: { tier: MergeTierId; x: number; y: number; angle: number }[];
}

export function saveMergeResume(snapshot: MergeResumeSnapshot | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!snapshot) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, JSON.stringify(snapshot));
  } catch {
    /* ignore */
  }
}

export function loadMergeResumeSnapshot(): MergeResumeSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MergeResumeSnapshot;
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

export function mergeResumeDetail(snap: MergeResumeSnapshot): string {
  return `${snap.mode === "daily" ? "Daily" : "Classic"} · ${snap.score.toLocaleString()} pts · tier ${snap.highestTier}`;
}
