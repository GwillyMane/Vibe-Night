import { DEFAULT_MERGE_BACKGROUND_ID } from "@/lib/vibe-merge/mergeBackgrounds";
import { getAccountLucky, setAccountLucky } from "@/lib/persist/accountCache";
import { isAccountMode } from "@/lib/persist/accountMode";
import { scheduleAccountCloudSync } from "@/lib/persist/cloudSync";
import type { LuckyRunState } from "./luckyEngine";

const PREFIX = "lucky-vibes:";

export interface LuckyPersisted {
  soundMuted: boolean;
  bestClassic: number;
  bestDaily: number;
  achievements: string[];
  playBackgroundId: string;
  stats: {
    runs: number;
    dailyPlays: number;
    totalSpins: number;
    totalLineWins: number;
    luckySpinsTriggered: number;
    vibeLockTriggered: number;
    grandVibes: number;
    bestSingleSpin: number;
    bestStreak: number;
    maxMultiplier: number;
  };
}

const DEFAULT: LuckyPersisted = {
  soundMuted: false,
  bestClassic: 0,
  bestDaily: 0,
  achievements: [],
  playBackgroundId: DEFAULT_MERGE_BACKGROUND_ID,
  stats: {
    runs: 0,
    dailyPlays: 0,
    totalSpins: 0,
    totalLineWins: 0,
    luckySpinsTriggered: 0,
    vibeLockTriggered: 0,
    grandVibes: 0,
    bestSingleSpin: 0,
    bestStreak: 0,
    maxMultiplier: 0,
  },
};

function safeParse(raw: string | null): LuckyPersisted {
  if (!raw) return { ...DEFAULT, stats: { ...DEFAULT.stats }, achievements: [] };
  try {
    const p = JSON.parse(raw) as Partial<LuckyPersisted>;
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

export function loadLuckyPersisted(): LuckyPersisted {
  if (typeof window === "undefined") return { ...DEFAULT, stats: { ...DEFAULT.stats } };
  if (isAccountMode()) {
    const cached = getAccountLucky();
    if (cached) return { ...cached, stats: { ...cached.stats }, achievements: [...cached.achievements] };
    return { ...DEFAULT, stats: { ...DEFAULT.stats } };
  }
  try {
    return safeParse(localStorage.getItem(`${PREFIX}persisted`));
  } catch {
    return { ...DEFAULT, stats: { ...DEFAULT.stats } };
  }
}

export function saveLuckyPersisted(p: LuckyPersisted) {
  if (typeof window === "undefined") return;
  if (isAccountMode()) {
    setAccountLucky({ ...p, stats: { ...p.stats }, achievements: [...p.achievements] });
    scheduleAccountCloudSync();
    return;
  }
  try {
    localStorage.setItem(`${PREFIX}persisted`, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

export function recordLuckyRun(
  p: LuckyPersisted,
  mode: "classic" | "daily" | "zen",
  score: number,
  run: {
    spinsUsed: number;
    lineWins: number;
    luckySpinsTriggered: number;
    vibeLockTriggered: number;
    grandVibe: boolean;
    bestSingleSpin: number;
    maxStreak: number;
    maxMultiplier: number;
  }
): LuckyPersisted {
  const next = { ...p, stats: { ...p.stats } };
  next.stats.runs += 1;
  next.stats.totalSpins += run.spinsUsed;
  next.stats.totalLineWins += run.lineWins;
  next.stats.luckySpinsTriggered += run.luckySpinsTriggered;
  next.stats.vibeLockTriggered += run.vibeLockTriggered;
  if (run.grandVibe) next.stats.grandVibes += 1;
  next.stats.bestSingleSpin = Math.max(next.stats.bestSingleSpin, run.bestSingleSpin);
  next.stats.bestStreak = Math.max(next.stats.bestStreak, run.maxStreak);
  next.stats.maxMultiplier = Math.max(next.stats.maxMultiplier, run.maxMultiplier);
  if (mode === "daily") next.stats.dailyPlays += 1;
  if (mode === "classic" && score > next.bestClassic) next.bestClassic = score;
  if (mode === "daily" && score > next.bestDaily) next.bestDaily = score;
  return next;
}

export type LuckyResumeSnapshot = {
  version: 1;
  savedAt: number;
  state: LuckyRunState;
};

export function loadLuckyResumeSnapshot(): LuckyResumeSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${PREFIX}resume`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LuckyResumeSnapshot;
    if (parsed.version !== 1 || !parsed.state || parsed.state.phase === "ended" || parsed.state.mode === "zen") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveLuckyResumeSnapshot(snapshot: LuckyResumeSnapshot | null) {
  if (typeof window === "undefined") return;
  try {
    if (snapshot) localStorage.setItem(`${PREFIX}resume`, JSON.stringify(snapshot));
    else localStorage.removeItem(`${PREFIX}resume`);
  } catch {
    /* ignore */
  }
}

export function luckyResumeDetail(snapshot: LuckyResumeSnapshot): string {
  const s = snapshot.state;
  const mode = s.mode === "daily" ? "Daily" : "Classic";
  return `${mode} · Score ${s.score.toLocaleString()} · ${s.spinsUsed}/${s.maxSpins} spins`;
}
