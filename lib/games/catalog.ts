/**
 * Vibe Night game catalog — add entries here as new titles ship.
 */
export type GameId = "vibe-crashers" | "vibe-merge" | "vibe-garden" | "catch-a-vibe" | "vibe-shift" | "lucky-vibes";

export const CRASHERS_GAME_ID: GameId = "vibe-crashers";

export type GameStatus = "available" | "coming_soon";

export interface GameCatalogEntry {
  id: GameId;
  title: string;
  shortTitle: string;
  tagline: string;
  description: string;
  previewImage: string;
  previewAlt: string;
  status: GameStatus;
  tags: string[];
  /** Shown in launch modal */
  features: string[];
  launchSubtitle?: string;
}

export const GAME_LIBRARY: GameCatalogEntry[] = [
  {
    id: "vibe-shift",
    title: "VIBE SHIFT",
    shortTitle: "Vibe Shift",
    tagline: "Slide · match · cascade",
    description:
      "Shift entire rows and columns on an 8×8 grid of GVC faces. Matches clear and cascade — but only scoring shifts count. Classic: 10 levels. Daily: 35 moves on today's board.",
    previewImage: "/games/vibe-shift-preview.png",
    previewAlt: "Vibe Shift slide-match puzzle preview",
    status: "available",
    tags: ["Puzzle", "Match", "Daily"],
    features: [
      "Wraparound row & column shifts",
      "Every shift counts — match lines or 2×2 squares to score",
      "Classic 10-level run & daily seeded board",
      "Vibe Night account leaderboards",
    ],
    launchSubtitle: "Good Vibes Club · slide match puzzler",
  },
  {
    id: "vibe-merge",
    title: "BIG VIBES",
    shortTitle: "Big Vibes",
    tagline: "Drop & merge the stack",
    description:
      "Drop colored vibe faces into the chamber. Match pairs to evolve the stack, chase combos, and climb the daily leaderboard — original GVC merge physics.",
    previewImage: "/games/big-vibes-preview.png",
    previewAlt: "Big Vibes merge gameplay preview",
    status: "available",
    tags: ["Merge", "Physics", "Daily"],
    features: [
      "10-tier vibe evolution chain",
      "Classic & daily seeded drops",
      "Combo chains & danger-line tension",
      "Vibe Night account leaderboards",
    ],
    launchSubtitle: "Good Vibes Club · merge physics arcade",
  },
  {
    id: "vibe-garden",
    title: "VIBE GARDEN",
    shortTitle: "Vibe Garden",
    tagline: "Plant · bloom · stabilize",
    description:
      "Tap to plant GVC vibes in a living physics garden. Chain bloom reactions, cleanse corruption, and grow the ecosystem before it collapses.",
    previewImage: "/games/vibe-garden-preview.png",
    previewAlt: "Vibe Garden ecosystem gameplay preview",
    status: "available",
    tags: ["Physics", "Ecosystem", "Daily", "Zen"],
    features: [
      "Tap-to-plant sandbox ecosystem",
      "Classic, daily seeded & zen modes",
      "Bloom chains & corruption tension",
      "Vibe Night account leaderboards",
    ],
    launchSubtitle: "Good Vibes Club · physics ecosystem puzzler",
  },
  {
    id: "lucky-vibes",
    title: "LUCKY VIBES",
    shortTitle: "Lucky Vibes",
    tagline: "Spin · stack · surge",
    description:
      "A modern GVC slot with 1,024 ways to win. Match colored vibe faces and premium citizens — Holo Leader #430, Super Vibe #1151, and Champion #1400. Trigger Lucky Spins or Vibe Lock on today's daily seed.",
    previewImage: "/games/lucky-vibes-preview.png",
    previewAlt: "Lucky Vibes slot gameplay preview",
    status: "available",
    tags: ["Arcade", "Slots", "Daily", "Zen"],
    features: [
      "6×5 ways slot with premium GVC token symbols",
      "Lucky Spins — free spins + rising multiplier",
      "Vibe Lock — hold & respin orb collector",
      "Classic, daily seeded & zen modes",
    ],
    launchSubtitle: "Good Vibes Club · modern ways slot",
  },
  {
    id: "catch-a-vibe",
    title: "CATCH A VIBE",
    shortTitle: "Catch A Vibe",
    tagline: "Swipe · catch · combo",
    description:
      "Swipe through launching GVC vibes to catch the flow. Chain matching colors, trigger bloom cascades, dodge Bad Vibes Guy, and chase high scores in classic, daily, and zen modes.",
    previewImage: "/games/catch-a-vibe-preview.png",
    previewAlt: "Catch A Vibe swipe arcade gameplay preview",
    status: "available",
    tags: ["Arcade", "Swipe", "Daily", "Zen"],
    features: [
      "Swipe-to-catch kinetic arcade action",
      "Classic, daily seeded & zen modes",
      "Combo chains, bloom cascades & bad-vibe dodges",
      "Vibe Night account leaderboards",
    ],
    launchSubtitle: "Good Vibes Club · swipe catch arcade",
  },
  {
    id: "vibe-crashers",
    title: "VIBE CRASHERS",
    shortTitle: "Vibe Crashers",
    tagline: "Physics slingshot puzzles",
    description:
      "Launch good-vibe shots into stacked bad-vibe structures. Clear targets with limited shots, earn stars, chase daily crashes, and climb the leaderboard.",
    previewImage: "/games/vibe-crashers-preview.png",
    previewAlt: "Vibe Crashers gameplay preview",
    status: "available",
    tags: ["Physics", "Puzzle", "20 levels", "Daily"],
    features: [
      "Twenty handcrafted Matter.js levels",
      "Daily seed — same board for everyone",
      "Stars, badges, achievements & streaks",
      "Daily / weekly / all-time leaderboards",
    ],
    launchSubtitle: "Good Vibes Club · slingshot crash puzzles",
  },
];

export function getGameById(id: string): GameCatalogEntry | undefined {
  return GAME_LIBRARY.find((g) => g.id === id);
}

const KNOWN_GAME_IDS = new Set<string>(GAME_LIBRARY.map((g) => g.id));

export function isKnownGameId(id: string): id is GameId {
  return KNOWN_GAME_IDS.has(id);
}

/** App Router path for a game deep link (matches `app/{id}/page.tsx`). */
export function gameRoutePath(id: GameId): string {
  return `/${id}`;
}

export const AVAILABLE_GAMES = GAME_LIBRARY.filter((g) => g.status === "available");
