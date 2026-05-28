"use client";

import CatchAVibeClientGate from "@/components/game/CatchAVibeClientGate";
import { GameRouteShell, useExitToLibrary } from "@/components/library/GameRouteShell";

/** Deep link: /catch-a-vibe launches Catch A Vibe directly. */
export default function CatchAVibePage() {
  const exitToLibrary = useExitToLibrary();
  return (
    <GameRouteShell>
      <CatchAVibeClientGate onExitToLibrary={exitToLibrary} />
    </GameRouteShell>
  );
}
