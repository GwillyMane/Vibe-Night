"use client";

import GameClientGate from "@/components/game/GameClientGate";
import { GameRouteShell, useExitToLibrary } from "@/components/library/GameRouteShell";

/** Deep link: /vibe-crashers launches Vibe Crashers directly. */
export default function VibeCrashersPage() {
  const exitToLibrary = useExitToLibrary();
  return (
    <GameRouteShell>
      <GameClientGate onExitToLibrary={exitToLibrary} />
    </GameRouteShell>
  );
}
