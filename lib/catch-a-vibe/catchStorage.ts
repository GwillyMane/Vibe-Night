import { DEFAULT_MERGE_BACKGROUND_ID } from "@/lib/vibe-merge/mergeBackgrounds";
import { getAccountCatch, setAccountCatch } from "@/lib/persist/accountCache";
import { isAccountMode } from "@/lib/persist/accountMode";
import { scheduleAccountCloudSync } from "@/lib/persist/cloudSync";

const PREFIX = "catch-a-vibe:";

export interface CatchPersisted {
  soundMuted: boolean;
  bestClassic: number;
  bestDaily: number;
  achievements: string[];
  playBackgroundId: string;
  stats: {
    runs: number;
    totalCatches: number;
    maxCombo: number;
    maxBloomChain: number;
    bestBadDodgedInRun: number;
    badDodged: number;
    goldenCatches: number;
    hasGoldenCascade: boolean;
  };
}

const DEFAULT: CatchPersisted = {
  soundMuted: false,
  bestClassic: 0,
  bestDaily: 0,
  achievements: [],
  playBackgroundId: DEFAULT_MERGE_BACKGROUND_ID,
  stats: { runs: 0, totalCatches: 0, maxCombo: 0, maxBloomChain: 0, bestBadDodgedInRun: 0, badDodged: 0, goldenCatches: 0, hasGoldenCascade: false },
};

function safeParse(raw: string | null): CatchPersisted {
  if (!raw) return { ...DEFAULT, stats: { ...DEFAULT.stats }, achievements: [] };
  try {
    const p = JSON.parse(raw) as Partial<CatchPersisted>;
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

export function loadCatchPersisted(): CatchPersisted {
  if (typeof window === "undefined") return { ...DEFAULT, stats: { ...DEFAULT.stats } };
  if (isAccountMode()) {
    const cached = getAccountCatch();
    if (cached) return { ...cached, stats: { ...cached.stats }, achievements: [...cached.achievements] };
    return { ...DEFAULT, stats: { ...DEFAULT.stats } };
  }
  try {
    return safeParse(localStorage.getItem(`${PREFIX}persisted`));
  } catch {
    return { ...DEFAULT, stats: { ...DEFAULT.stats } };
  }
}

export function loadGuestCatchPersisted(): CatchPersisted {
  if (typeof window === "undefined") return { ...DEFAULT, stats: { ...DEFAULT.stats } };
  try {
    return safeParse(localStorage.getItem(`${PREFIX}persisted`));
  } catch {
    return { ...DEFAULT, stats: { ...DEFAULT.stats } };
  }
}

export function saveCatchPersisted(p: CatchPersisted) {
  if (typeof window === "undefined") return;
  if (isAccountMode()) {
    setAccountCatch({ ...p, stats: { ...p.stats }, achievements: [...p.achievements] });
    scheduleAccountCloudSync();
    return;
  }
  try {
    localStorage.setItem(`${PREFIX}persisted`, JSON.stringify(p));
  } catch {
    /* noop */
  }
}

export function recordCatchRun(
  p: CatchPersisted,
  mode: "classic" | "daily" | "zen",
  score: number,
  stats: {
    catches: number;
    maxCombo: number;
    bloomChains: number;
    badDodged: number;
    goldenCatches: number;
  }
): CatchPersisted {
  const next = { ...p, stats: { ...p.stats } };
  next.stats.runs += 1;
  next.stats.totalCatches += stats.catches;
  next.stats.maxCombo = Math.max(next.stats.maxCombo, stats.maxCombo);
  next.stats.maxBloomChain = Math.max(next.stats.maxBloomChain, stats.bloomChains);
  next.stats.bestBadDodgedInRun = Math.max(next.stats.bestBadDodgedInRun, stats.badDodged);
  next.stats.badDodged += stats.badDodged;
  next.stats.goldenCatches += stats.goldenCatches;
  if (stats.goldenCatches >= 1 && stats.bloomChains >= 1) next.stats.hasGoldenCascade = true;
  if (mode === "classic" && score > next.bestClassic) next.bestClassic = score;
  if (mode === "daily" && score > next.bestDaily) next.bestDaily = score;
  return next;
}
