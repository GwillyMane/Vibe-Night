import { DEFAULT_MERGE_BACKGROUND_ID } from "@/lib/vibe-merge/mergeBackgrounds";

import { getAccountShift, setAccountShift } from "@/lib/persist/accountCache";

import { isAccountMode } from "@/lib/persist/accountMode";

import { scheduleAccountCloudSync } from "@/lib/persist/cloudSync";

import type { ShiftRunState } from "./shiftEngine";
const PREFIX = "vibe-shift:";



export interface ShiftPersisted {

  soundMuted: boolean;

  bestClassic: number;

  bestDaily: number;

  achievements: string[];

  playBackgroundId: string;

  stats: {

    runs: number;

    classicWins: number;

    dailyPlays: number;

    totalClears: number;

    maxCascade: number;

    bestLevelReached: number;

  };

}



const DEFAULT: ShiftPersisted = {

  soundMuted: false,

  bestClassic: 0,

  bestDaily: 0,

  achievements: [],

  playBackgroundId: DEFAULT_MERGE_BACKGROUND_ID,

  stats: {

    runs: 0,

    classicWins: 0,

    dailyPlays: 0,

    totalClears: 0,

    maxCascade: 0,

    bestLevelReached: 0,

  },

};



function safeParse(raw: string | null): ShiftPersisted {

  if (!raw) return { ...DEFAULT, stats: { ...DEFAULT.stats }, achievements: [] };

  try {

    const p = JSON.parse(raw) as Partial<ShiftPersisted>;

    return {

      ...DEFAULT,

      ...p,

      stats: { ...DEFAULT.stats, ...p.stats },

      achievements: p.achievements ?? [],

      playBackgroundId: p.playBackgroundId || DEFAULT_MERGE_BACKGROUND_ID,

    };

  } catch {

    return { ...DEFAULT, stats: { ...DEFAULT.stats }, achievements: [] };

  }

}



export function loadShiftPersisted(): ShiftPersisted {

  if (typeof window === "undefined") return { ...DEFAULT, stats: { ...DEFAULT.stats } };

  if (isAccountMode()) {

    const cached = getAccountShift();

    if (cached) return { ...cached, stats: { ...cached.stats }, achievements: [...cached.achievements] };

    return { ...DEFAULT, stats: { ...DEFAULT.stats } };

  }

  try {

    return safeParse(localStorage.getItem(`${PREFIX}persisted`));

  } catch {

    return { ...DEFAULT, stats: { ...DEFAULT.stats } };

  }

}



export function saveShiftPersisted(p: ShiftPersisted) {

  if (typeof window === "undefined") return;

  if (isAccountMode()) {

    setAccountShift({ ...p, stats: { ...p.stats }, achievements: [...p.achievements] });

    scheduleAccountCloudSync();

    return;

  }

  try {

    localStorage.setItem(`${PREFIX}persisted`, JSON.stringify(p));

  } catch {

    /* ignore */

  }

}



export function loadShiftResume(): string | null {

  if (typeof window === "undefined") return null;

  try {

    return localStorage.getItem(`${PREFIX}resume`);

  } catch {

    return null;

  }

}



export function saveShiftResume(json: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (json) localStorage.setItem(`${PREFIX}resume`, json);
    else localStorage.removeItem(`${PREFIX}resume`);
  } catch {
    /* ignore */
  }
}

export type ShiftResumeSnapshot = {
  version: 1;
  savedAt: number;
  state: ShiftRunState;
  runSeed: string;
};

export function loadShiftResumeSnapshot(): ShiftResumeSnapshot | null {
  const raw = loadShiftResume();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ShiftResumeSnapshot;
    if (parsed.version !== 1 || !parsed.state || parsed.state.phase === "ended") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveShiftResumeSnapshot(snapshot: ShiftResumeSnapshot | null) {
  saveShiftResume(snapshot ? JSON.stringify(snapshot) : null);
}

export function shiftResumeDetail(snapshot: ShiftResumeSnapshot): string {
  const s = snapshot.state;
  const mode = s.mode === "daily" ? "Daily" : "Classic";
  return `${mode} · Level ${s.level} · Score ${s.score.toLocaleString()} · ${s.movesUsed} moves`;
}

export function recordShiftRun(
  p: ShiftPersisted,
  mode: "classic" | "daily",
  score: number,
  stats: { level: number; totalClears: number; maxCascade: number; endReason: string | null }
): ShiftPersisted {
  const next = { ...p, stats: { ...p.stats } };
  next.stats.runs += 1;
  next.stats.totalClears += stats.totalClears;
  next.stats.maxCascade = Math.max(next.stats.maxCascade, stats.maxCascade);
  next.stats.bestLevelReached = Math.max(next.stats.bestLevelReached, stats.level);
  if (mode === "daily") next.stats.dailyPlays += 1;
  if (stats.endReason === "classic_complete") next.stats.classicWins += 1;
  if (mode === "classic" && score > next.bestClassic) next.bestClassic = score;
  if (mode === "daily" && score > next.bestDaily) next.bestDaily = score;
  return next;
}
