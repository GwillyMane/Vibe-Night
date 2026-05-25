"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AudioZone } from "@/lib/audio/audioTransitions";
import {
  getState,
  initMusicEngine,
  next,
  pause,
  play,
  prev,
  seek,
  selectTrack,
  setMuted,
  setVolume,
  setZone,
  subscribeEngine,
  toggleMuted,
  togglePlayPause,
  type EngineState,
} from "@/lib/audio/engine";
import { loadMusicState, saveMusicState } from "@/lib/audio/audioPersistence";
import { SOUNDTRACK, DEFAULT_TRACK_ID, type SoundtrackTrack } from "@/lib/audio/soundtrack";

interface GlobalAudioContextValue extends EngineState {
  tracks: readonly SoundtrackTrack[];
  expanded: boolean;
  setExpanded: (v: boolean) => void;
  playPause: () => void;
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  selectTrack: (id: string) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  setMuted: (m: boolean) => void;
  seek: (sec: number) => void;
  setAudioZone: (zone: AudioZone) => void;
}

const GlobalAudioContext = createContext<GlobalAudioContextValue | null>(null);

export function GlobalAudioProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EngineState>(() => ({
    trackId: DEFAULT_TRACK_ID,
    isPlaying: false,
    volume: 0.55,
    muted: false,
    zone: "hub",
    progressSec: 0,
    durationSec: 0,
  }));
  const [expanded, setExpandedState] = useState(false);

  useEffect(() => {
    setState(initMusicEngine());
    setExpandedState(loadMusicState().expanded);
    return subscribeEngine(setState);
  }, []);

  const setExpanded = useCallback((v: boolean) => {
    setExpandedState(v);
    const saved = loadMusicState();
    saveMusicState({ ...saved, expanded: v });
  }, []);

  const value = useMemo<GlobalAudioContextValue>(
    () => ({
      ...state,
      tracks: SOUNDTRACK,
      expanded,
      setExpanded,
      playPause: togglePlayPause,
      play: () => void play(),
      pause: () => void pause(),
      next: () => void next(),
      prev: () => void prev(),
      selectTrack: (id) => void selectTrack(id),
      setVolume,
      toggleMute: toggleMuted,
      setMuted,
      seek,
      setAudioZone: setZone,
    }),
    [state, expanded, setExpanded]
  );

  return <GlobalAudioContext.Provider value={value}>{children}</GlobalAudioContext.Provider>;
}

export function useGlobalAudio(): GlobalAudioContextValue {
  const ctx = useContext(GlobalAudioContext);
  if (!ctx) throw new Error("useGlobalAudio must be used within GlobalAudioProvider");
  return ctx;
}

export function useGlobalAudioControls(): Pick<
  GlobalAudioContextValue,
  "playPause" | "play" | "pause" | "next" | "prev" | "setVolume" | "toggleMute" | "setAudioZone"
> {
  const { playPause, play, pause, next, prev, setVolume, toggleMute, setAudioZone } = useGlobalAudio();
  return { playPause, play, pause, next, prev, setVolume, toggleMute, setAudioZone };
}
