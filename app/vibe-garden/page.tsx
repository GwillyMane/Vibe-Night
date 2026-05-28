"use client";

import VibeGardenClientGate from "@/components/game/VibeGardenClientGate";
import { GameRouteShell, useExitToLibrary } from "@/components/library/GameRouteShell";

/** Deep link: /vibe-garden launches Vibe Garden directly. */
export default function VibeGardenPage() {
  const exitToLibrary = useExitToLibrary();
  return (
    <GameRouteShell>
      <VibeGardenClientGate onExitToLibrary={exitToLibrary} />
    </GameRouteShell>
  );
}
