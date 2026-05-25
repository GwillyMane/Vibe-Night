"use client";

import { VibeNightProviders } from "@/components/VibeNightProviders";
import { ArcadeMusicPlayer } from "@/components/audio/ArcadeMusicPlayer";

export function VibeNightShell({ children }: { children: React.ReactNode }) {
  return (
    <VibeNightProviders>
      {children}
      <ArcadeMusicPlayer />
    </VibeNightProviders>
  );
}
