import { Howl } from "howler";
import {
  effectiveVolume,
  fadeVolume,
  crossfadeTracks,
  type AudioZone,
} from "./audioTransitions";
import { loadMusicState, saveMusicState, type MusicPersistedState } from "./audioPersistence";
import {
  DEFAULT_TRACK_ID,
  getTrack,
  nextTrackId,
  prevTrackId,
  type SoundtrackTrack,
} from "./soundtrack";

export type EngineState = {
  trackId: string;
  isPlaying: boolean;
  volume: number;
  muted: boolean;
  zone: AudioZone;
  progressSec: number;
  durationSec: number;
};

type Listener = (state: EngineState) => void;

const howlCache = new Map<string, Howl>();
let activeTrackId: string = DEFAULT_TRACK_ID;
let activeHowl: Howl | null = null;
let baseVolume = 0.55;
let muted = false;
let zone: AudioZone = "hub";
let isPlaying = false;
let wantsPlay = false;
let pendingSeekSec = 0;
let progressSec = 0;
let durationSec = 0;
let crossfading = false;
let gestureBound = false;
let progressTimer: ReturnType<typeof setInterval> | null = null;

const listeners = new Set<Listener>();

function emit(): void {
  const snap = getState();
  for (const fn of listeners) fn(snap);
}

function persist(): void {
  saveMusicState({
    trackId: activeTrackId,
    isPlaying: wantsPlay,
    volume: baseVolume,
    muted,
    expanded: loadMusicState().expanded,
    positionSec: progressSec,
  });
}

function getOrCreateHowl(track: SoundtrackTrack): Howl {
  let howl = howlCache.get(track.id);
  if (howl) return howl;

  howl = new Howl({
    src: [track.src],
    html5: true,
    volume: 0,
    onload: () => {
      durationSec = howl!.duration() || 0;
      if (pendingSeekSec > 0 && track.id === activeTrackId) {
        howl!.seek(pendingSeekSec);
        pendingSeekSec = 0;
      }
      emit();
    },
    onplay: () => {
      isPlaying = true;
      startProgressTimer();
      emit();
    },
    onpause: () => {
      isPlaying = false;
      stopProgressTimer();
      emit();
    },
    onstop: () => {
      isPlaying = false;
      stopProgressTimer();
      emit();
    },
    onend: () => {
      if (!crossfading) void switchTrack(nextTrackId(activeTrackId), true);
    },
    onloaderror: (_id, err) => {
      console.warn("[music] load error", track.id, err);
    },
  });

  howlCache.set(track.id, howl);
  return howl;
}

function startProgressTimer(): void {
  stopProgressTimer();
  progressTimer = setInterval(() => {
    if (!activeHowl?.playing()) return;
    progressSec = (activeHowl.seek() as number) || 0;
    emit();
    persist();
  }, 500);
}

function stopProgressTimer(): void {
  if (progressTimer) {
    clearInterval(progressTimer);
    progressTimer = null;
  }
}

function applyVolume(howl: Howl | null = activeHowl): void {
  if (!howl) return;
  const vol = effectiveVolume(baseVolume, muted, zone);
  void fadeVolume(howl, vol, 280);
}

function bindGestureResume(): void {
  if (gestureBound || typeof window === "undefined") return;
  gestureBound = true;
  const resume = () => {
    if (wantsPlay && activeHowl && !activeHowl.playing()) {
      activeHowl.play();
      applyVolume();
    }
    window.removeEventListener("pointerdown", resume);
    window.removeEventListener("keydown", resume);
    gestureBound = false;
  };
  window.addEventListener("pointerdown", resume, { once: true });
  window.addEventListener("keydown", resume, { once: true });
}

async function switchTrack(trackId: string, autoPlay = false): Promise<void> {
  const track = getTrack(trackId);
  if (!track) return;

  crossfading = true;
  const prev = activeHowl;
  const next = getOrCreateHowl(track);
  activeTrackId = trackId;
  activeHowl = next;

  const targetVol = effectiveVolume(baseVolume, muted, zone);
  if (autoPlay || wantsPlay) {
    wantsPlay = true;
    await crossfadeTracks(prev, next, targetVol, 800);
    isPlaying = next.playing();
  } else {
    if (prev?.playing()) {
      await fadeVolume(prev, 0, 400);
      prev.pause();
    }
    next.volume(0);
  }

  crossfading = false;
  progressSec = (next.seek() as number) || 0;
  durationSec = next.duration() || durationSec;
  persist();
  emit();
}

let initialized = false;

export function initMusicEngine(): EngineState {
  if (initialized) return getState();
  initialized = true;

  const saved = loadMusicState();
  activeTrackId = getTrack(saved.trackId) ? saved.trackId : DEFAULT_TRACK_ID;
  baseVolume = saved.volume;
  muted = saved.muted;
  wantsPlay = saved.isPlaying;
  pendingSeekSec = saved.positionSec;
  progressSec = saved.positionSec;

  const track = getTrack(activeTrackId);
  if (track) {
    activeHowl = getOrCreateHowl(track);
    activeHowl.volume(0);
    if (wantsPlay) bindGestureResume();
  }

  emit();
  return getState();
}

export function subscribeEngine(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getState(): EngineState {
  return {
    trackId: activeTrackId,
    isPlaying,
    volume: baseVolume,
    muted,
    zone,
    progressSec,
    durationSec,
  };
}

export async function play(): Promise<void> {
  if (!activeHowl) {
    const track = getTrack(activeTrackId);
    if (!track) return;
    activeHowl = getOrCreateHowl(track);
  }
  wantsPlay = true;
  if (!activeHowl.playing()) activeHowl.play();
  applyVolume();
  persist();
  emit();
}

export async function pause(): Promise<void> {
  wantsPlay = false;
  if (activeHowl?.playing()) {
    progressSec = (activeHowl.seek() as number) || progressSec;
    activeHowl.pause();
  }
  persist();
  emit();
}

export function togglePlayPause(): void {
  if (wantsPlay && isPlaying) void pause();
  else void play();
}

export async function next(): Promise<void> {
  await switchTrack(nextTrackId(activeTrackId), wantsPlay);
}

export async function prev(): Promise<void> {
  if (activeHowl && progressSec > 3) {
    activeHowl.seek(0);
    progressSec = 0;
    persist();
    emit();
    return;
  }
  await switchTrack(prevTrackId(activeTrackId), wantsPlay);
}

export async function selectTrack(trackId: string): Promise<void> {
  if (trackId === activeTrackId) return;
  await switchTrack(trackId, wantsPlay);
}

export function setVolume(v: number): void {
  baseVolume = Math.min(1, Math.max(0, v));
  applyVolume();
  persist();
  emit();
}

export function setMuted(m: boolean): void {
  muted = m;
  applyVolume();
  persist();
  emit();
}

export function toggleMuted(): void {
  setMuted(!muted);
}

export function setZone(z: AudioZone): void {
  if (zone === z) return;
  zone = z;
  applyVolume();
  emit();
}

export function seek(sec: number): void {
  if (!activeHowl) return;
  const clamped = Math.max(0, Math.min(durationSec || sec, sec));
  activeHowl.seek(clamped);
  progressSec = clamped;
  persist();
  emit();
}

export function destroyEngine(): void {
  stopProgressTimer();
  for (const howl of howlCache.values()) howl.unload();
  howlCache.clear();
  activeHowl = null;
  listeners.clear();
}
