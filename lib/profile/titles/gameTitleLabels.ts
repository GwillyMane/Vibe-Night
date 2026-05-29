import type { GameId } from "@/lib/games/catalog";

/** Equippable profile title labels keyed by gameId:slug */
export const GAME_TITLE_LABELS: Record<string, string> = {
  // Vibe Crashers
  "vibe-crashers:first-launch": "Launch Operator",
  "vibe-crashers:first-clear": "Structure Smasher",
  "vibe-crashers:five-clear": "Level Hopper",
  "vibe-crashers:combo-cleanse": "Combo Cleanser",
  "vibe-crashers:daily-viber": "Daily Crasher",
  "vibe-crashers:three-star-vibe": "Perfect Shot",
  "vibe-crashers:one-shot-wonder": "One-Shot Wonder",
  "vibe-crashers:ten-clear": "Tour Veteran",
  "vibe-crashers:structure-breaker": "Structure Breaker",
  "vibe-crashers:full-tour": "Crash Architect",

  // Big Vibes (merge)
  "vibe-merge:merge-first": "First Stacker",
  "vibe-merge:merge-combo-3": "Combo Creator",
  "vibe-merge:merge-gold": "Pink Peak",
  "vibe-merge:merge-daily": "Daily Grinder",
  "vibe-merge:merge-vibefoot": "Vibefoot Climber",
  "vibe-merge:merge-chill": "Chill Stacker",
  "vibe-merge:merge-10k": "Stack Starter",
  "vibe-merge:merge-candy": "Candy Architect",
  "vibe-merge:merge-50k": "Vibetown Veteran",
  "vibe-merge:merge-legend": "Golden Stacker",

  // Vibe Garden
  "vibe-garden:first-bloom": "Seedling",
  "vibe-garden:zen-cultivator": "Zen Gardener",
  "vibe-garden:garden-chain-5": "Bloom Chain",
  "vibe-garden:chain-10": "Cascade Keeper",
  "vibe-garden:corruption-survivor": "Corruption Survivor",
  "vibe-garden:golden-ecosystem": "Bloom Keeper",
  "vibe-garden:master-gardener": "Garden Guardian",
  "vibe-garden:garden-score-10k": "Harvest Hero",
  "vibe-garden:perfect-stabilization": "Perfect Balance",
  "vibe-garden:legendary-cascade": "Legendary Bloom",

  // Catch A Vibe
  "catch-a-vibe:first-catch": "First Catcher",
  "catch-a-vibe:zen-flow": "Zen Flow",
  "catch-a-vibe:bad-dodger": "Bad Vibe Dodger",
  "catch-a-vibe:perfect-wave": "Perfect Wave",
  "catch-a-vibe:bloom-frenzy": "Bloom Frenzy",
  "catch-a-vibe:golden-cascade": "Golden Cascade",
  "catch-a-vibe:catch-combo-15": "Combo Catcher",
  "catch-a-vibe:catch-score-5k": "High Scorer",
  "catch-a-vibe:combo-25": "Combo Master",
  "catch-a-vibe:legendary-catch": "Chaos Catcher",

  // Vibe Shift
  "vibe-shift:first-shift": "First Slider",
  "vibe-shift:cascade-3": "Chain Reactor",
  "vibe-shift:level-5": "Midnight Slider",
  "vibe-shift:daily-regular": "Daily Slider",
  "vibe-shift:clear-100": "Match Maker",
  "vibe-shift:daily-5k": "Daily Grind",
  "vibe-shift:classic-3k": "Shift Scorer",
  "vibe-shift:classic-win": "Full Shift",
  "vibe-shift:cascade-5": "Cascade King",
  "vibe-shift:shift-legend": "Shift Legend",

  // Lucky Vibes
  "lucky-vibes:first-pull": "First Pull",
  "lucky-vibes:first-way": "Way Finder",
  "lucky-vibes:lucky-spins": "Lucky Spinner",
  "lucky-vibes:vibe-lock": "Vibe Lock",
  "lucky-vibes:mult-10": "Multiplier Hunter",
  "lucky-vibes:daily-regular": "Daily High Roller",
  "lucky-vibes:champion-hit": "Champion Line",
  "lucky-vibes:grand-vibe": "Grand Vibe",
  "lucky-vibes:daily-4k": "Daily Jackpot",
  "lucky-vibes:lucky-legend": "Lucky Legend",
};

export const GAME_ID_SHORT: Record<GameId, string> = {
  "vibe-crashers": "crashers",
  "vibe-merge": "merge",
  "vibe-garden": "garden",
  "catch-a-vibe": "catch",
  "vibe-shift": "shift",
  "lucky-vibes": "lucky",
};

export function gameTitleId(gameId: GameId, slug: string): string {
  return `${GAME_ID_SHORT[gameId]}-${slug}`;
}

export function gameTitleLabel(gameId: GameId, slug: string): string {
  return GAME_TITLE_LABELS[`${gameId}:${slug}`] ?? slug.replace(/-/g, " ");
}
