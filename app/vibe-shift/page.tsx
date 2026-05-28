"use client";

import VibeShiftClientGate from "@/components/game/VibeShiftClientGate";
import { GameRouteShell, useExitToLibrary } from "@/components/library/GameRouteShell";

/** Deep link: /vibe-shift launches Vibe Shift directly. */
export default function VibeShiftPage() {
  const exitToLibrary = useExitToLibrary();
  return (
    <GameRouteShell>
      <VibeShiftClientGate onExitToLibrary={exitToLibrary} />
    </GameRouteShell>
  );
}
