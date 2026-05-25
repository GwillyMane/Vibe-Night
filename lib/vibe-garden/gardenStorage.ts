import type { GardenColorId } from "./gardenConfig";
import { DEFAULT_MERGE_BACKGROUND_ID } from "@/lib/vibe-merge/mergeBackgrounds";
import { getAccountGarden, setAccountGarden } from "@/lib/persist/accountCache";
import { isAccountMode } from "@/lib/persist/accountMode";
import { scheduleAccountCloudSync } from "@/lib/persist/cloudSync";

const PREFIX = "vibe-garden:";

export interface GardenPersisted {
  soundMuted: boolean;
  bestClassic: number;
  bestDaily: number;
  achievements: string[];
  playBackgroundId: string;
  stats: {
    runs: number;
    totalPlants: number;
    maxBloomChain: number;
    bestCleansesInRun: number;
    cleanses: number;
    goldBlooms: number;
  };
  unlockedThemes: string[];
}

const DEFAULT: GardenPersisted = {
  soundMuted: false,
  bestClassic: 0,
  bestDaily: 0,
  achievements: [],
  playBackgroundId: DEFAULT_MERGE_BACKGROUND_ID,
  stats: { runs: 0, totalPlants: 0, maxBloomChain: 0, bestCleansesInRun: 0, cleanses: 0, goldBlooms: 0 },
  unlockedThemes: ["default"],
};

function safeParse(raw: string | null): GardenPersisted {
  if (!raw) return { ...DEFAULT, stats: { ...DEFAULT.stats }, achievements: [], unlockedThemes: ["default"] };
  try {
    const p = JSON.parse(raw) as Partial<GardenPersisted>;
    return {
      ...DEFAULT,
      ...p,
      stats: { ...DEFAULT.stats, ...p.stats },
      achievements: p.achievements ?? [],
      unlockedThemes: p.unlockedThemes ?? ["default"],
      playBackgroundId: p.playBackgroundId || DEFAULT_MERGE_BACKGROUND_ID,
    };
  } catch {
    return { ...DEFAULT, stats: { ...DEFAULT.stats }, achievements: [], unlockedThemes: ["default"] };
  }
}

export function loadGardenPersisted(): GardenPersisted {
  if (typeof window === "undefined") return { ...DEFAULT, stats: { ...DEFAULT.stats } };
  if (isAccountMode()) {
    const cached = getAccountGarden();
    if (cached) return { ...cached, stats: { ...cached.stats }, achievements: [...cached.achievements], unlockedThemes: [...cached.unlockedThemes] };
    return { ...DEFAULT, stats: { ...DEFAULT.stats } };
  }
  try {
    return safeParse(localStorage.getItem(`${PREFIX}persisted`));
  } catch {
    return { ...DEFAULT, stats: { ...DEFAULT.stats } };
  }
}

export function loadGuestGardenPersisted(): GardenPersisted {
  if (typeof window === "undefined") return { ...DEFAULT, stats: { ...DEFAULT.stats } };
  try {
    return safeParse(localStorage.getItem(`${PREFIX}persisted`));
  } catch {
    return { ...DEFAULT, stats: { ...DEFAULT.stats } };
  }
}

export function saveGardenPersisted(p: GardenPersisted) {
  if (typeof window === "undefined") return;
  if (isAccountMode()) {
    setAccountGarden({
      ...p,
      stats: { ...p.stats },
      achievements: [...p.achievements],
      unlockedThemes: [...p.unlockedThemes],
    });
    scheduleAccountCloudSync();
    return;
  }
  try {
    localStorage.setItem(`${PREFIX}persisted`, JSON.stringify(p));
  } catch {
    /* noop */
  }
}

export function recordGardenRun(
  p: GardenPersisted,
  mode: "classic" | "daily" | "zen",
  score: number,
  stats: { plants: number; maxChain: number; cleanses: number; goldBlooms: number }
): GardenPersisted {
  const next = { ...p, stats: { ...p.stats } };
  next.stats.runs += 1;
  next.stats.totalPlants += stats.plants;
  next.stats.maxBloomChain = Math.max(next.stats.maxBloomChain, stats.maxChain);
  next.stats.bestCleansesInRun = Math.max(next.stats.bestCleansesInRun, stats.cleanses);
  next.stats.cleanses += stats.cleanses;
  next.stats.goldBlooms += stats.goldBlooms;
  if (mode === "classic" && score > next.bestClassic) next.bestClassic = score;
  if (mode === "daily" && score > next.bestDaily) next.bestDaily = score;
  return next;
}

export type { GardenColorId };
