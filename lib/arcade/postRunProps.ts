import type { GameId } from "@/lib/games/catalog";

/** Shared props passed from game shells into result screens → ArcadeResultShell. */
export interface ArcadePostRunProps {
  muted: boolean;
  isLoggedIn: boolean;
  showSignIn?: boolean;
  serverRank?: number | null;
  newAchievementSlugs?: string[];
  onOpenAuth?: () => void;
  onOpenLeaderboard?: () => void;
  onRetry: () => void;
  onMenu?: () => void;
  badgeGameId?: GameId;
}

export function defaultShowSignIn(isLoggedIn: boolean, submitEligible: boolean): boolean {
  return submitEligible && !isLoggedIn;
}
