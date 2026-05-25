import type { CatchPersisted } from "@/lib/catch-a-vibe/catchStorage";
import type { LuckyPersisted } from "@/lib/lucky-vibes/luckyStorage";
import type { ShiftPersisted } from "@/lib/vibe-shift/shiftStorage";
import type { GardenPersisted } from "@/lib/vibe-garden/gardenStorage";
import type { MergePersisted } from "@/lib/vibe-merge/mergeStorage";
import type { PersistedState } from "@/lib/storage";
import { mapProgressApiResponse } from "./responseMapper";

let crashers: PersistedState | null = null;
let merge: MergePersisted | null = null;
let garden: GardenPersisted | null = null;
let catchGame: CatchPersisted | null = null;
let shiftGame: ShiftPersisted | null = null;
let luckyGame: LuckyPersisted | null = null;
let hydratePromise: Promise<void> | null = null;

export function clearAccountCache(): void {
  crashers = null;
  merge = null;
  garden = null;
  catchGame = null;
  shiftGame = null;
  luckyGame = null;
  hydratePromise = null;
}

export function getAccountCrashers(): PersistedState | null {
  return crashers;
}
export function setAccountCrashers(p: PersistedState): void {
  crashers = p;
}

export function getAccountMerge(): MergePersisted | null {
  return merge;
}
export function setAccountMerge(p: MergePersisted): void {
  merge = p;
}

export function getAccountGarden(): GardenPersisted | null {
  return garden;
}
export function setAccountGarden(p: GardenPersisted): void {
  garden = p;
}

export function getAccountCatch(): CatchPersisted | null {
  return catchGame;
}
export function setAccountCatch(p: CatchPersisted): void {
  catchGame = p;
}

export function getAccountShift(): ShiftPersisted | null {
  return shiftGame;
}
export function setAccountShift(p: ShiftPersisted): void {
  shiftGame = p;
}

export function getAccountLucky(): LuckyPersisted | null {
  return luckyGame;
}
export function setAccountLucky(p: LuckyPersisted): void {
  luckyGame = p;
}

export function ensureAccountHydrated(): Promise<void> {
  if (hydratePromise) return hydratePromise;
  hydratePromise = (async () => {
    const res = await fetch("/api/progress/me", { credentials: "include" });
    if (!res.ok) throw new Error("Failed to load account progress");
    const data = (await res.json()) as Record<string, unknown>;
    const { hydrateAllFromProgressResponse } = await import("./hydrateFromProgress");
    hydrateAllFromProgressResponse(mapProgressApiResponse(data));
  })().catch((e) => {
    hydratePromise = null;
    throw e;
  });
  return hydratePromise;
}

export type AccountProgressResponse = {
  levelProgress: Array<{
    levelId: string;
    bestScore: number;
    bestStars: number;
    completed: boolean;
  }>;
  dailyProgress: Array<{
    dailySeed: string;
    levelId: string;
    bestScore: number;
    bestStars: number;
    completed: boolean;
  }>;
  achievements: Array<{ gameId: string; achievementId: string }>;
  settings: { selectedProjectile: string | null; soundMuted: boolean; reducedMotion: boolean | null } | null;
  gameStats?: Array<{ gameId: string; statsJson: Record<string, unknown> }>;
};
