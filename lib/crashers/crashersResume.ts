import type { ActiveChallenge } from "@/lib/levels";

const KEY = "vibe-crashers:resume";

export interface CrashersResumeSnapshot {
  version: 1;
  savedAt: number;
  challenge: ActiveChallenge;
  score: number;
  shots: number;
}

export function saveCrashersResume(snapshot: CrashersResumeSnapshot | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!snapshot) {
      localStorage.removeItem(KEY);
      return;
    }
    localStorage.setItem(KEY, JSON.stringify(snapshot));
  } catch {
    /* ignore quota */
  }
}

export function loadCrashersResumeSnapshot(): CrashersResumeSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CrashersResumeSnapshot;
    if (parsed.version !== 1 || !parsed.challenge) return null;
    if (Date.now() - parsed.savedAt > 1000 * 60 * 60 * 48) {
      localStorage.removeItem(KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function crashersResumeDetail(snap: CrashersResumeSnapshot): string {
  const kind = snap.challenge.kind === "daily" ? "Daily" : "Level";
  const id =
    snap.challenge.kind === "handcrafted"
      ? snap.challenge.levelId
      : snap.challenge.kind === "daily"
        ? snap.challenge.levelId
        : "?";
  return `${kind} ${id} · ${snap.score.toLocaleString()} pts · ${snap.shots} shots left`;
}
