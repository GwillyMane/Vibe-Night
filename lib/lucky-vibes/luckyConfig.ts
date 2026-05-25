/** Lucky Vibes — modern 6×5 ways slot constants. */

export const LUCKY_GAME_ID = "lucky-vibes" as const;
export const LUCKY_LEVEL_ID = "lucky" as const;
export const PRODUCT_TITLE = "LUCKY VIBES";

export const REELS = 6;
export const ROWS = 5;
export const CLASSIC_SPIN_BUDGET = 30;
export const DAILY_SPIN_BUDGET = 25;
export const MAX_SCORE = 250_000;

export const PREMIUM_TOKEN_IDS = ["430", "1151", "1400"] as const;
export type PremiumTokenId = (typeof PREMIUM_TOKEN_IDS)[number];

export const TOKEN_DISPLAY_NAMES: Record<PremiumTokenId, string> = {
  "430": "Holo Leader",
  "1151": "Super Vibe",
  "1400": "Champion of Vibes",
};

/** Display names for feature trigger symbols (internal ids stay scatter / orb). */
export const FEATURE_SYMBOL_NAMES = {
  scatter: "One of One",
  orb: "Craig",
} as const;

/** Lucky Spins trigger — official GVC brand badge art. */
export const LUCKY_SPINS_SYMBOL_URL =
  "https://aagrmr5pocteyhfg.public.blob.vercel-storage.com/brand-assets/badges/1776285686228-one_of_one.webp";

/** Vibe Lock trigger — official GVC brand character art. */
export const VIBE_LOCK_SYMBOL_URL =
  "https://aagrmr5pocteyhfg.public.blob.vercel-storage.com/brand-assets/characters/1776711653209-Craig.webp";

export type FaceId = 0 | 1 | 2 | 3 | 4 | 5;

export type SymbolId =
  | `face:${FaceId}`
  | `token:430`
  | `token:1151`
  | `token:1400`
  | "wild"
  | "scatter"
  | "orb"
  | "blank";

export type LuckyMode = "classic" | "daily" | "zen";

export const LOW_FACES: FaceId[] = [0, 1, 2];
export const MID_FACES: FaceId[] = [3, 4, 5];

export const PAYING_SYMBOLS: SymbolId[] = [
  "face:0",
  "face:1",
  "face:2",
  "face:3",
  "face:4",
  "face:5",
  "token:430",
  "token:1151",
  "token:1400",
  "wild",
];

export type PaytableEntry = Record<3 | 4 | 5 | 6, number>;

export const PAYTABLE: Record<string, PaytableEntry> = {
  "face:0": { 3: 4, 4: 10, 5: 25, 6: 60 },
  "face:1": { 3: 4, 4: 10, 5: 25, 6: 60 },
  "face:2": { 3: 4, 4: 10, 5: 25, 6: 60 },
  "face:3": { 3: 6, 4: 15, 5: 40, 6: 90 },
  "face:4": { 3: 6, 4: 15, 5: 40, 6: 90 },
  "face:5": { 3: 6, 4: 15, 5: 40, 6: 90 },
  "token:430": { 3: 20, 4: 50, 5: 120, 6: 300 },
  "token:1151": { 3: 30, 4: 80, 5: 200, 6: 500 },
  "token:1400": { 3: 50, 4: 125, 5: 350, 6: 800 },
  wild: { 3: 80, 4: 200, 5: 500, 6: 1200 },
};

export interface WeightedSymbol {
  symbol: SymbolId;
  weight: number;
}

/** Per-reel base weights (normalized at draw time). */
export const BASE_REEL_WEIGHTS: WeightedSymbol[] = [
  { symbol: "face:0", weight: 12 },
  { symbol: "face:1", weight: 12 },
  { symbol: "face:2", weight: 12 },
  { symbol: "face:3", weight: 8 },
  { symbol: "face:4", weight: 8 },
  { symbol: "face:5", weight: 8 },
  { symbol: "token:430", weight: 4.5 },
  { symbol: "token:1151", weight: 3.2 },
  { symbol: "token:1400", weight: 2 },
  { symbol: "wild", weight: 2.2 },
  { symbol: "scatter", weight: 1.4 },
  { symbol: "orb", weight: 2.0 },
];

/** Middle reels spawn Craig slightly more often (0-indexed). */
export const CRAIG_FAVORED_REELS = [1, 2, 3, 4] as const;

export const CRAIG_FAVORED_REEL_BOOST = 1.55;

/** Lucky Spins — richer tokens, fewer low faces, no Craig during feature. */
export const LUCKY_SPINS_REEL_WEIGHTS: WeightedSymbol[] = [
  { symbol: "face:0", weight: 7 },
  { symbol: "face:1", weight: 7 },
  { symbol: "face:2", weight: 7 },
  { symbol: "face:3", weight: 10 },
  { symbol: "face:4", weight: 10 },
  { symbol: "face:5", weight: 10 },
  { symbol: "token:430", weight: 6 },
  { symbol: "token:1151", weight: 4.5 },
  { symbol: "token:1400", weight: 3 },
  { symbol: "wild", weight: 4 },
  { symbol: "scatter", weight: 2 },
  { symbol: "orb", weight: 0 },
];

/** Reels that gain extra premium/wild weight during Lucky Spins (0-indexed). */
export const LUCKY_SPINS_EXPANDED_REELS = [1, 2, 3, 4] as const;

export const LUCKY_SPINS_EXPANDED_REEL_BOOST = 1.4;

export const LUCKY_SPINS_START_MULTIPLIER = 1;

export const SCATTER_LUCKY_SPINS: Record<number, number> = {
  3: 10,
  4: 12,
  5: 15,
  6: 20,
};

export const LUCKY_SPINS_RETRIGGER = 5;
export const MAX_LUCKY_MULTIPLIER = 20;
export const SCATTER_TEASE_PTS = 25;
export const CHAMPION_FLAT_BONUS = 100;

export const VIBE_LOCK_MIN_ORBS = 4;
export const VIBE_LOCK_RESPINS = 3;
export const TOTAL_CELLS = REELS * ROWS;

/** Vibe Lock respins — each empty cell rolls Craig or stays blank. */
export const VIBE_LOCK_REEL_WEIGHTS: WeightedSymbol[] = [
  { symbol: "blank", weight: 27 },
  { symbol: "orb", weight: 3 },
];

export type OrbValueKind = "10" | "15" | "20" | "25" | "40" | "50" | "MINI" | "MINOR" | "MAJOR";

export const ORB_VALUE_WEIGHTS: { kind: OrbValueKind; weight: number }[] = [
  { kind: "10", weight: 30 },
  { kind: "15", weight: 25 },
  { kind: "20", weight: 20 },
  { kind: "25", weight: 12 },
  { kind: "40", weight: 7 },
  { kind: "50", weight: 4 },
  { kind: "MINI", weight: 1.2 },
  { kind: "MINOR", weight: 0.5 },
  { kind: "MAJOR", weight: 0.3 },
];

export const ORB_VALUE_PTS: Record<OrbValueKind, number> = {
  "10": 25,
  "15": 40,
  "20": 55,
  "25": 70,
  "40": 110,
  "50": 150,
  MINI: 450,
  MINOR: 1000,
  MAJOR: 3000,
};

export const GRAND_VIBE_BONUS = 8000;

export type WinTier = "none" | "nice" | "super" | "big" | "mega" | "legendary";

export const WIN_TIER_THRESHOLDS: { tier: WinTier; min: number }[] = [
  { tier: "legendary", min: 4000 },
  { tier: "mega", min: 1500 },
  { tier: "big", min: 500 },
  { tier: "super", min: 200 },
  { tier: "nice", min: 50 },
];

export function winTierForAmount(amount: number): WinTier {
  for (const { tier, min } of WIN_TIER_THRESHOLDS) {
    if (amount >= min) return tier;
  }
  return "none";
}

export function streakMultiplier(streak: number): number {
  if (streak >= 4) return 2;
  if (streak === 3) return 1.5;
  if (streak === 2) return 1.25;
  return 1;
}

export const LUCKY_RULES_HINT =
  "Match ways left to right. 3 One of One = Lucky Spins. 4 Craig = Vibe Lock.";

export const LUCKY_STAGE_SIZE = 640;
