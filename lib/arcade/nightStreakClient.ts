import { bumpNightStreak as bumpLocalNightStreak, getNightStreak, type NightStreakState } from "./nightStreak";

/** Bump cross-game streak — server when logged in, localStorage for guests. */
export async function bumpNightStreakLoggedIn(isLoggedIn: boolean): Promise<NightStreakState> {
  if (isLoggedIn && typeof window !== "undefined") {
    try {
      const res = await fetch("/api/streaks/bump", { method: "POST", credentials: "include" });
      if (res.ok) {
        const data = (await res.json()) as {
          currentStreak: number;
          longestStreak: number;
          lastPlayDate: string | null;
        };
        const next: NightStreakState = {
          currentStreak: data.currentStreak,
          longestStreak: data.longestStreak,
          lastPlayDate: data.lastPlayDate,
        };
        if (typeof window !== "undefined") {
          localStorage.setItem("vibe-night:streak", JSON.stringify(next));
        }
        return next;
      }
    } catch {
      /* fall through to local */
    }
  }
  return bumpLocalNightStreak();
}

export { getNightStreak };
