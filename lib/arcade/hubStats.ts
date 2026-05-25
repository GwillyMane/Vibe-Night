import type { GameId } from "@/lib/games/catalog";
import { todaySeed } from "@/lib/daily-seed";

export interface HubGameStats {
  dailyBest: number;
  dailySeed: string;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/** Client-side hub card stats from per-game localStorage. */
export function readHubGameStats(gameId: GameId): HubGameStats {
  const seed = todaySeed();

  switch (gameId) {
    case "vibe-crashers": {
      const p = readJson<{ bestByLevel?: Record<string, number> }>("vibe-sling:persisted", {});
      const dailyKey = Object.keys(p.bestByLevel ?? {}).find((k) => k.startsWith(`daily:${seed}:`));
      return { dailyBest: dailyKey ? (p.bestByLevel?.[dailyKey] ?? 0) : 0, dailySeed: seed };
    }
    case "vibe-merge": {
      const p = readJson<{ bestDaily?: number; bestDailySeed?: string }>("vibe-merge:state", {});
      return {
        dailyBest: p.bestDailySeed === seed ? (p.bestDaily ?? 0) : 0,
        dailySeed: seed,
      };
    }
    case "vibe-garden": {
      const p = readJson<{ bestDaily?: number }>("vibe-garden:persisted", {});
      return { dailyBest: p.bestDaily ?? 0, dailySeed: seed };
    }
    case "catch-a-vibe": {
      const p = readJson<{ bestDaily?: number }>("catch-a-vibe:persisted", {});
      return { dailyBest: p.bestDaily ?? 0, dailySeed: seed };
    }
    case "vibe-shift": {
      const p = readJson<{ bestDaily?: number }>("vibe-shift:persisted", {});
      return { dailyBest: p.bestDaily ?? 0, dailySeed: seed };
    }
    case "lucky-vibes": {
      const p = readJson<{ bestDaily?: number }>("lucky-vibes:persisted", {});
      return { dailyBest: p.bestDaily ?? 0, dailySeed: seed };
    }
    default:
      return { dailyBest: 0, dailySeed: seed };
  }
}
