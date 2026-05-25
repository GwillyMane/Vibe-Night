import { DEFAULT_MERGE_BACKGROUND_ID } from "./mergeBackgrounds";
import { getAccountMerge, setAccountMerge } from "@/lib/persist/accountCache";
import { isAccountMode } from "@/lib/persist/accountMode";
import { scheduleAccountCloudSync } from "@/lib/persist/cloudSync";

const PREFIX = "vibe-merge:";

function key(k: string) {
  return PREFIX + k;
}

export interface MergePersisted {
  bestClassic: number;
  bestDaily: number;
  bestDailySeed: string | null;
  highestTierEver: number;
  totalMerges: number;
  maxCombo: number;
  achievements: string[];
  soundMuted: boolean;
  dailyCompletedDate: string | null;
  playBackgroundId: string;
}

const DEFAULT: MergePersisted = {
  bestClassic: 0,
  bestDaily: 0,
  bestDailySeed: null,
  highestTierEver: 1,
  totalMerges: 0,
  maxCombo: 0,
  achievements: [],
  soundMuted: false,
  dailyCompletedDate: null,
  playBackgroundId: DEFAULT_MERGE_BACKGROUND_ID,
};

export function loadMergePersisted(): MergePersisted {
  if (typeof window === "undefined") return { ...DEFAULT };
  if (isAccountMode()) {
    const cached = getAccountMerge();
    if (cached) return { ...cached };
    return { ...DEFAULT };
  }
  try {
    const raw = localStorage.getItem(key("state"));
    if (!raw) return { ...DEFAULT };
    const parsed = { ...DEFAULT, ...JSON.parse(raw) } as MergePersisted;
    if (!parsed.playBackgroundId) parsed.playBackgroundId = DEFAULT_MERGE_BACKGROUND_ID;
    return parsed;
  } catch {
    return { ...DEFAULT };
  }
}

export function loadGuestMergePersisted(): MergePersisted {
  if (typeof window === "undefined") return { ...DEFAULT };
  try {
    const raw = localStorage.getItem(key("state"));
    if (!raw) return { ...DEFAULT };
    const parsed = { ...DEFAULT, ...JSON.parse(raw) } as MergePersisted;
    if (!parsed.playBackgroundId) parsed.playBackgroundId = DEFAULT_MERGE_BACKGROUND_ID;
    return parsed;
  } catch {
    return { ...DEFAULT };
  }
}

export function saveMergePersisted(p: MergePersisted): void {
  if (typeof window === "undefined") return;
  if (isAccountMode()) {
    setAccountMerge({ ...p });
    scheduleAccountCloudSync();
    return;
  }
  try {
    localStorage.setItem(key("state"), JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

export function recordRun(
  p: MergePersisted,
  opts: {
    mode: "classic" | "daily";
    score: number;
    highestTier: number;
    merges: number;
    maxCombo: number;
    dailySeed?: string;
  }
): MergePersisted {
  const next = { ...p };
  if (opts.mode === "classic") {
    next.bestClassic = Math.max(next.bestClassic, opts.score);
  } else {
    next.bestDaily = Math.max(next.bestDaily, opts.score);
    if (opts.dailySeed) next.bestDailySeed = opts.dailySeed;
  }
  next.highestTierEver = Math.max(next.highestTierEver, opts.highestTier);
  next.totalMerges += opts.merges;
  next.maxCombo = Math.max(next.maxCombo, opts.maxCombo);
  return next;
}
