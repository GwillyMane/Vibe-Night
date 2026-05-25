/** Cross-game Vibe Night daily streak (localStorage). */
const STREAK_KEY = "vibe-night:streak";

export interface NightStreakState {
  currentStreak: number;
  longestStreak: number;
  lastPlayDate: string | null;
}

function todayNy(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

function yesterdayNy(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

function load(): NightStreakState {
  if (typeof window === "undefined") {
    return { currentStreak: 0, longestStreak: 0, lastPlayDate: null };
  }
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return { currentStreak: 0, longestStreak: 0, lastPlayDate: null };
    return JSON.parse(raw) as NightStreakState;
  } catch {
    return { currentStreak: 0, longestStreak: 0, lastPlayDate: null };
  }
}

function save(s: NightStreakState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STREAK_KEY, JSON.stringify(s));
}

/** Bump streak once per calendar day when starting any daily mode. */
export function bumpNightStreak(): NightStreakState {
  const today = todayNy();
  const prev = load();
  if (prev.lastPlayDate === today) return prev;

  let current = 1;
  if (prev.lastPlayDate === yesterdayNy()) {
    current = prev.currentStreak + 1;
  }

  const next: NightStreakState = {
    currentStreak: current,
    longestStreak: Math.max(prev.longestStreak, current),
    lastPlayDate: today,
  };
  save(next);
  return next;
}

export function getNightStreak(): NightStreakState {
  return load();
}
