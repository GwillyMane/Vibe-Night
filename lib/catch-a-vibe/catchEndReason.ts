import type { CatchRunState } from "./catchPressure";
import { BAD_VIBE_MAX_STRIKES } from "./catchConfig";

export type CatchEndReason = "bad_vibes";

export interface CatchEndCopy {
  title: string;
  detail: string;
  tip: string;
}

export const CATCH_END_COPY: Record<CatchEndReason, CatchEndCopy> = {
  bad_vibes: {
    title: "Too many bad vibes",
    detail: "You caught 3 Bad Vibes Guys. The flow couldn't recover.",
    tip: "Tip: Swipe past purple storm clouds — let bad vibes fly away. Only catch the good ones!",
  },
};

export function detectCatchGameOver(state: CatchRunState, zenMode: boolean): CatchEndReason | null {
  if (zenMode) return null;
  if (state.badStrikes >= BAD_VIBE_MAX_STRIKES) return "bad_vibes";
  return null;
}

export const CATCH_RULES_HINT =
  "Swipe through good vibes to catch them and build combos. Avoid Bad Vibes Guy — catch 3 and you're out. Let bad vibes fly past you!";
