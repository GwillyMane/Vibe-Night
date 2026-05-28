"use client";

import { Suspense } from "react";
import { VibeNightProviders } from "@/components/VibeNightProviders";
import { ArcadeMusicPlayer } from "@/components/audio/ArcadeMusicPlayer";
import { ArcadeDebugOverlay } from "@/components/arcade/ArcadeDebugOverlay";

export function VibeNightShell({ children }: { children: React.ReactNode }) {
  return (
    <VibeNightProviders>
      {children}
      <ArcadeMusicPlayer />
      <Suspense fallback={null}>
        <ArcadeDebugOverlay />
      </Suspense>
    </VibeNightProviders>
  );
}
