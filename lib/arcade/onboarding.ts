import type { GameId } from "@/lib/games/catalog";

export interface CoachStep {
  title: string;
  body: string;
  emoji?: string;
}

const ONBOARD_PREFIX = "vibe-night:onboarded:";

export function onboardingKey(gameId: GameId | "vibe-crashers"): string {
  return `${ONBOARD_PREFIX}${gameId}`;
}

export function hasCompletedOnboarding(gameId: GameId | "vibe-crashers"): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(onboardingKey(gameId)) === "1";
}

export function markOnboardingComplete(gameId: GameId | "vibe-crashers"): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(onboardingKey(gameId), "1");
}

export const COACH_STEPS: Record<GameId | "vibe-crashers", CoachStep[]> = {
  "vibe-crashers": [
    { title: "Drag to aim", body: "Pull the good vibe back from the sling. A dotted line shows your shot.", emoji: "🎯" },
    { title: "Release to launch", body: "Let go to send your vibe flying into the stack.", emoji: "🚀" },
    { title: "Hit weak points", body: "Glass and fragile blocks break first — use them to collapse structures.", emoji: "💥" },
    { title: "Clear all targets", body: "Destroy every bad-vibe target before you run out of shots.", emoji: "⭐" },
  ],
  "vibe-merge": [
    { title: "Merge matching vibes", body: "Drop faces so equal tiers touch — they merge into the next tier.", emoji: "🔄" },
    { title: "Avoid overflow", body: "Keep the stack below the danger line or it's game over.", emoji: "⚠️" },
    { title: "Bigger merges = bigger score", body: "Chain combos and reach higher tiers for massive points.", emoji: "📈" },
    { title: "Watch the danger line", body: "The line pulses when you're close — recover fast or lose the run.", emoji: "🔴" },
  ],
  "vibe-garden": [
    { title: "Plant vibes", body: "Tap the garden to drop the next GVC vibe. Cluster matching colors.", emoji: "🌱" },
    { title: "Chain blooms", body: "Groups of 3+ pop in bloom chains — clear space and score big.", emoji: "🌸" },
    { title: "Cleanse corruption", body: "Purple corruption spreads — bloom nearby vibes to push it back.", emoji: "🧹" },
    { title: "Avoid collapse", body: "If corruption maxes out or stability crashes, the garden falls.", emoji: "🍂" },
  ],
  "catch-a-vibe": [
    { title: "Swipe to catch", body: "Draw a line through launching good vibes — they absorb into your flow.", emoji: "✨" },
    { title: "Dodge bad vibes", body: "Bad Vibes Guy is trouble. Let him fly past — don't swipe him!", emoji: "🚫" },
    { title: "Chain combos", body: "Catch matching colors in a row to multiply your score.", emoji: "🔥" },
    { title: "Golden bloom bursts", body: "Rare golden vibes trigger bloom cascades — grab them when you can!", emoji: "🌟" },
  ],
  "vibe-shift": [
    { title: "Shift rows or columns", body: "Drag horizontally on a row or vertically on a column to wrap-shift faces.", emoji: "↔️" },
    { title: "Lines & squares", body: "Match 3+ in a row or column, or form a 2×2 square of the same vibe.", emoji: "🟨" },
    { title: "Match-or-revert", body: "If your shift doesn't create a match, the board snaps back — no move spent.", emoji: "↩️" },
    { title: "Chains score big", body: "Clears refill and cascade — bigger combos multiply your points.", emoji: "💥" },
  ],
  "lucky-vibes": [
    { title: "Tap SPIN", body: "Six reels, 1,024 ways — match symbols left to right on adjacent reels.", emoji: "🎰" },
    { title: "Premium tokens", body: "Holo Leader #430, Super Vibe #1151, and Champion #1400 pay the most.", emoji: "👑" },
    { title: "Lucky Spins", body: "3+ One of One badges trigger free spins with a rising win multiplier.", emoji: "✨" },
    { title: "Vibe Lock", body: "4+ Craig symbols lock in place and respin for point values — fill the grid for GRAND VIBE.", emoji: "🔒" },
  ],
};
