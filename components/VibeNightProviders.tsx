"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { GlobalAudioProvider } from "@/contexts/GlobalAudioContext";

/** Shared auth + global soundtrack for the library and all games. */
export function VibeNightProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <GlobalAudioProvider>{children}</GlobalAudioProvider>
    </AuthProvider>
  );
}
