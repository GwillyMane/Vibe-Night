"use client";

import { useEffect } from "react";
import { useGlobalAudioControls } from "@/contexts/GlobalAudioContext";
import type { AudioZone } from "@/lib/audio/audioTransitions";

/** Duck global soundtrack during active gameplay; restore on menus/results. */
export function useArcadeAudioZone(zone: AudioZone): void {
  const { setAudioZone } = useGlobalAudioControls();
  useEffect(() => {
    setAudioZone(zone);
    return () => setAudioZone("hub");
  }, [zone, setAudioZone]);
}
