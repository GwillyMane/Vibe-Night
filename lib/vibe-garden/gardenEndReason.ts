import type { GardenCorruptionState } from "./gardenCorruption";
import {
  CORRUPTION_MAX,
  MAX_ENTITIES,
  STABILITY_COLLAPSE_CORRUPTION_MIN,
} from "./gardenConfig";

/** Why a classic/daily run ended — shown on the result screen. */
export type GardenEndReason = "corruption" | "stability" | "daily_complete";

export interface GardenEndCopy {
  title: string;
  detail: string;
  tip: string;
}

export const GARDEN_END_COPY: Record<GardenEndReason, GardenEndCopy> = {
  corruption: {
    title: "Corruption took over",
    detail: "The corruption meter reached 100%. Too many orange cracked vibes spread unchecked.",
    tip: "Tip: Trigger bloom chains on corrupted vibes to cleanse them. Mint and Blue vibes slow the spread.",
  },
  stability: {
    title: "Ecosystem collapsed",
    detail: "Stability hit zero while corruption was already high. The garden could not recover.",
    tip: "Tip: Chain blooms to raise stability. Keep corruption below 30% to avoid collapse.",
  },
  daily_complete: {
    title: "Daily garden complete",
    detail: "Your 90-second daily run is finished. Score submitted for today's seed.",
    tip: "Tip: Bigger bloom cascades = higher daily score. Come back tomorrow for a new layout.",
  },
};

export function detectGameOver(
  state: GardenCorruptionState,
  zenMode: boolean
): GardenEndReason | null {
  if (zenMode) return null;
  if (state.meter >= CORRUPTION_MAX) return "corruption";
  if (state.stability <= 0 && state.meter >= STABILITY_COLLAPSE_CORRUPTION_MIN) return "stability";
  return null;
}

export function isGardenFull(entityCountNow: number): boolean {
  return entityCountNow >= MAX_ENTITIES;
}

export function gardenFullMessage(): string {
  return `Garden crowded (${MAX_ENTITIES} vibes). Chain blooms pop neighbors to free space — or the oldest vibe fades when you plant at cap.`;
}

/** One-line rules shown during play. */
export const GARDEN_RULES_HINT =
  "Match 3+ vibes in a chain to pop and clear space. Orange corruption spreads fast — cleanse it, then chain. Risk multiplier grows as corruption rises.";
