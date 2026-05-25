import type { GameId } from "@/lib/games/catalog";

export interface SoundtrackTrack {
  id: string;
  title: string;
  src: string;
  mood: string;
  associatedGame?: GameId | "hub";
  durationSec?: number;
  order: number;
}

/** Future profile expansion — not wired to API yet. */
export type SoundtrackProfilePrefs = {
  favoriteTrackId?: string;
  equippedTrackId?: string;
};

function musicPath(filename: string): string {
  return `/music/${encodeURIComponent(filename)}`;
}

export const SOUNDTRACK: SoundtrackTrack[] = [
  {
    id: "shaka-flow",
    title: "Shaka Flow",
    src: musicPath("Shaka Flow.mp3"),
    mood: "Ambient arcade",
    associatedGame: "hub" as const,
    order: 0,
  },
  {
    id: "good-vibe-morning",
    title: "Good Vibe Morning",
    src: musicPath("Good Vibe Morning.mp3"),
    mood: "Warm & bright",
    associatedGame: "vibe-merge" as const,
    order: 1,
  },
  {
    id: "dj-chill-vibes",
    title: "DJ Chill Vibes",
    src: musicPath("DJ Chill Vibes.mp3"),
    mood: "Late-night lounge",
    associatedGame: "catch-a-vibe" as const,
    order: 2,
  },
].sort((a, b) => a.order - b.order);

export const DEFAULT_TRACK_ID = SOUNDTRACK[0]!.id;

export function getTrack(id: string): SoundtrackTrack | undefined {
  return SOUNDTRACK.find((t) => t.id === id);
}

export function nextTrackId(currentId: string): string {
  const idx = SOUNDTRACK.findIndex((t) => t.id === currentId);
  if (idx < 0) return DEFAULT_TRACK_ID;
  return SOUNDTRACK[(idx + 1) % SOUNDTRACK.length]!.id;
}

export function prevTrackId(currentId: string): string {
  const idx = SOUNDTRACK.findIndex((t) => t.id === currentId);
  if (idx < 0) return DEFAULT_TRACK_ID;
  return SOUNDTRACK[(idx - 1 + SOUNDTRACK.length) % SOUNDTRACK.length]!.id;
}
