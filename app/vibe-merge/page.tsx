"use client";

import VibeMergeClientGate from "@/components/game/VibeMergeClientGate";
import { GameRouteShell, useExitToLibrary } from "@/components/library/GameRouteShell";

/** Deep link: /vibe-merge launches Big Vibes directly. */
export default function VibeMergePage() {
  const exitToLibrary = useExitToLibrary();
  return (
    <GameRouteShell>
      <VibeMergeClientGate onExitToLibrary={exitToLibrary} />
    </GameRouteShell>
  );
}
