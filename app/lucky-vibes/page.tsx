"use client";

import LuckyVibesClientGate from "@/components/game/LuckyVibesClientGate";
import { GameRouteShell, useExitToLibrary } from "@/components/library/GameRouteShell";

/** Deep link: /lucky-vibes launches Lucky Vibes directly. */
export default function LuckyVibesPage() {
  const exitToLibrary = useExitToLibrary();
  return (
    <GameRouteShell>
      <LuckyVibesClientGate onExitToLibrary={exitToLibrary} />
    </GameRouteShell>
  );
}
