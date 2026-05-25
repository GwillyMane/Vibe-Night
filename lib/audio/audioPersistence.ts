import { DEFAULT_TRACK_ID } from "./soundtrack";

export const MUSIC_STORAGE_KEY = "vibe-night:music";
export const MUSIC_INTRO_SEEN_KEY = "vibe-night:music:intro-seen";

export interface MusicPersistedState {
  trackId: string;
  isPlaying: boolean;
  volume: number;
  muted: boolean;
  expanded: boolean;
  positionSec: number;
}

const DEFAULTS: MusicPersistedState = {
  trackId: DEFAULT_TRACK_ID,
  isPlaying: false,
  volume: 0.55,
  muted: false,
  expanded: false,
  positionSec: 0,
};

export function loadMusicState(): MusicPersistedState {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(MUSIC_STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<MusicPersistedState>;
    return {
      trackId: typeof parsed.trackId === "string" ? parsed.trackId : DEFAULTS.trackId,
      isPlaying: Boolean(parsed.isPlaying),
      volume: clampNum(parsed.volume, 0, 1, DEFAULTS.volume),
      muted: Boolean(parsed.muted),
      expanded: Boolean(parsed.expanded),
      positionSec: clampNum(parsed.positionSec, 0, 86400, 0),
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveMusicState(state: MusicPersistedState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MUSIC_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota / private mode */
  }
}

export function hasSeenMusicIntro(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(MUSIC_INTRO_SEEN_KEY) === "1";
}

export function markMusicIntroSeen(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MUSIC_INTRO_SEEN_KEY, "1");
  } catch {
    /* noop */
  }
}

function clampNum(v: unknown, min: number, max: number, fallback: number): number {
  if (typeof v !== "number" || !Number.isFinite(v)) return fallback;
  return Math.min(max, Math.max(min, v));
}
