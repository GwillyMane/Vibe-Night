import { ACHIEVEMENTS } from "@/lib/achievements";
import { GOOD_VIBE_FACE_SKINS } from "@/lib/assets/gvcBrandFaces";
import type { GameId } from "@/lib/games/catalog";
import { MERGE_ACHIEVEMENTS } from "@/lib/vibe-merge/mergeAchievements";
import { GARDEN_ACHIEVEMENTS } from "@/lib/vibe-garden/gardenAchievements";
import { CATCH_ACHIEVEMENTS } from "@/lib/catch-a-vibe/catchAchievements";
import { SHIFT_ACHIEVEMENTS } from "@/lib/vibe-shift/shiftAchievements";
import { LUCKY_ACHIEVEMENTS } from "@/lib/lucky-vibes/luckyAchievements";

export type TitleRarity = "common" | "rare" | "legendary";
export type CosmeticType = "theme" | "border" | "glow" | "background" | "particle" | "face";
export type AchievementTier = "bronze" | "silver" | "gold" | "cosmic";
export type ArcadeTier = "Rookie" | "Regular" | "Crusher" | "Legend";

export interface ProfileTitleDef {
  id: string;
  label: string;
  rarity: TitleRarity;
  /** Always owned (e.g. default title). */
  defaultOwned?: boolean;
  /** Unlock rule key evaluated server-side in unlocks.ts */
  unlockRule:
    | "default"
    | "achievement"
    | "stat"
    | "tier"
    | "diversity";
  unlockParams?: Record<string, string | number>;
}

export interface CosmeticDef {
  id: string;
  label: string;
  type: CosmeticType;
  defaultOwned?: boolean;
  unlockRule?: "default" | "achievement" | "tier" | "streak";
  unlockParams?: Record<string, string | number>;
}

export interface UnifiedAchievementDef {
  key: string;
  gameId: GameId;
  slug: string;
  title: string;
  description: string;
  tier: AchievementTier;
}

export const DEFAULT_TITLE_ID = "vibe-night-regular";
export const DEFAULT_AVATAR_FACE = "shaka";
export const DEFAULT_THEME_ID = "midnight";
export const DEFAULT_BORDER_ID = "gold-ring";
export const DEFAULT_GLOW_ID = "gold";
export const DEFAULT_BACKGROUND_ID = "embers";
export const DEFAULT_PARTICLE_ID = "gold-drift";

export const PROFILE_TITLES: ProfileTitleDef[] = [
  {
    id: DEFAULT_TITLE_ID,
    label: "Vibe Night Regular",
    rarity: "common",
    defaultOwned: true,
    unlockRule: "default",
  },
  {
    id: "bloom-keeper",
    label: "Bloom Keeper",
    rarity: "rare",
    unlockRule: "achievement",
    unlockParams: { gameId: "vibe-garden", slug: "golden-ecosystem" },
  },
  {
    id: "chaos-catcher",
    label: "Chaos Catcher",
    rarity: "legendary",
    unlockRule: "achievement",
    unlockParams: { gameId: "catch-a-vibe", slug: "legendary-catch" },
  },
  {
    id: "golden-stacker",
    label: "Golden Stacker",
    rarity: "legendary",
    unlockRule: "achievement",
    unlockParams: { gameId: "vibe-merge", slug: "merge-legend" },
  },
  {
    id: "garden-guardian",
    label: "Garden Guardian",
    rarity: "rare",
    unlockRule: "achievement",
    unlockParams: { gameId: "vibe-garden", slug: "master-gardener" },
  },
  {
    id: "crash-architect",
    label: "Crash Architect",
    rarity: "legendary",
    unlockRule: "achievement",
    unlockParams: { gameId: "vibe-crashers", slug: "full-tour" },
  },
  {
    id: "combo-hunter",
    label: "Combo Hunter",
    rarity: "rare",
    unlockRule: "stat",
    unlockParams: { stat: "maxCombo", min: 25 },
  },
  {
    id: "flow-survivor",
    label: "Flow Survivor",
    rarity: "rare",
    unlockRule: "stat",
    unlockParams: { stat: "zenParticipation", min: 1 },
  },
  {
    id: "legendary-viber",
    label: "Legendary Viber",
    rarity: "legendary",
    unlockRule: "tier",
    unlockParams: { tier: "Legend" },
  },
  {
    id: "arcade-architect",
    label: "Arcade Architect",
    rarity: "legendary",
    unlockRule: "diversity",
    unlockParams: { gamesWithScores: 5 },
  },
];

export const PROFILE_THEMES: CosmeticDef[] = [
  { id: "midnight", label: "Midnight", type: "theme", defaultOwned: true, unlockRule: "default" },
  { id: "gold-wash", label: "Gold Wash", type: "theme", unlockRule: "streak", unlockParams: { days: 7 } },
  { id: "cosmic-pink", label: "Cosmic Pink", type: "theme", unlockRule: "tier", unlockParams: { tier: "Crusher" } },
  { id: "ember-core", label: "Ember Core", type: "theme", unlockRule: "achievement", unlockParams: { gameId: "vibe-crashers", slug: "structure-breaker" } },
];

export const PROFILE_BORDERS: CosmeticDef[] = [
  { id: "gold-ring", label: "Gold Ring", type: "border", defaultOwned: true, unlockRule: "default" },
  { id: "silver-frame", label: "Silver Frame", type: "border", unlockRule: "achievement", unlockParams: { gameId: "vibe-merge", slug: "merge-combo-3" } },
  { id: "cosmic-halo", label: "Cosmic Halo", type: "border", unlockRule: "tier", unlockParams: { tier: "Legend" } },
];

export const PROFILE_GLOWS: CosmeticDef[] = [
  { id: "gold", label: "Gold Glow", type: "glow", defaultOwned: true, unlockRule: "default" },
  { id: "pink", label: "Pink Pulse", type: "glow", unlockRule: "achievement", unlockParams: { gameId: "vibe-garden", slug: "first-bloom" } },
  { id: "green", label: "Mint Surge", type: "glow", unlockRule: "achievement", unlockParams: { gameId: "catch-a-vibe", slug: "perfect-wave" } },
];

export const PROFILE_BACKGROUNDS: CosmeticDef[] = [
  { id: "embers", label: "Floating Embers", type: "background", defaultOwned: true, unlockRule: "default" },
  { id: "grid", label: "Grid Drift", type: "background", unlockRule: "streak", unlockParams: { days: 3 } },
  { id: "bloom", label: "Bloom Mist", type: "background", unlockRule: "achievement", unlockParams: { gameId: "vibe-garden", slug: "chain-10" } },
  { id: "stack", label: "Stack Energy", type: "background", unlockRule: "achievement", unlockParams: { gameId: "vibe-merge", slug: "merge-gold" } },
];

export const PROFILE_PARTICLES: CosmeticDef[] = [
  { id: "gold-drift", label: "Gold Drift", type: "particle", defaultOwned: true, unlockRule: "default" },
  { id: "spark-burst", label: "Spark Burst", type: "particle", unlockRule: "achievement", unlockParams: { gameId: "vibe-crashers", slug: "combo-cleanse" } },
  { id: "star-trail", label: "Star Trail", type: "particle", unlockRule: "streak", unlockParams: { days: 14 } },
];

export const VIBE_FACES: CosmeticDef[] = [
  { id: "shaka", label: "Shaka", type: "face", defaultOwned: true, unlockRule: "default" },
  ...GOOD_VIBE_FACE_SKINS.map((f) => ({
    id: f.slug,
    label: f.label,
    type: "face" as const,
    unlockRule: "default" as const,
    defaultOwned: true,
  })),
];

export function achievementKey(gameId: GameId, slug: string): string {
  return `${gameId}:${slug}`;
}

export function parseAchievementKey(key: string): { gameId: GameId; slug: string } | null {
  const i = key.indexOf(":");
  if (i <= 0) return null;
  const gameId = key.slice(0, i) as GameId;
  const slug = key.slice(i + 1);
  if (!slug) return null;
  return { gameId, slug };
}

export const UNIFIED_ACHIEVEMENTS: UnifiedAchievementDef[] = [
  ...ACHIEVEMENTS.map((a) => ({
    key: achievementKey("vibe-crashers", a.slug),
    gameId: "vibe-crashers" as const,
    slug: a.slug,
    title: a.title,
    description: a.description,
    tier: a.tier,
  })),
  ...MERGE_ACHIEVEMENTS.map((a) => ({
    key: achievementKey("vibe-merge", a.slug),
    gameId: "vibe-merge" as const,
    slug: a.slug,
    title: a.title,
    description: a.description,
    tier: a.tier,
  })),
  ...GARDEN_ACHIEVEMENTS.map((a) => ({
    key: achievementKey("vibe-garden", a.slug),
    gameId: "vibe-garden" as const,
    slug: a.slug,
    title: a.title,
    description: a.description,
    tier: a.tier,
  })),
  ...CATCH_ACHIEVEMENTS.map((a) => ({
    key: achievementKey("catch-a-vibe", a.slug),
    gameId: "catch-a-vibe" as const,
    slug: a.slug,
    title: a.title,
    description: a.description,
    tier: a.tier,
  })),
  ...SHIFT_ACHIEVEMENTS.map((a) => ({
    key: achievementKey("vibe-shift", a.slug),
    gameId: "vibe-shift" as const,
    slug: a.slug,
    title: a.title,
    description: a.description,
    tier: a.tier,
  })),
  ...LUCKY_ACHIEVEMENTS.map((a) => ({
    key: achievementKey("lucky-vibes", a.slug),
    gameId: "lucky-vibes" as const,
    slug: a.slug,
    title: a.title,
    description: a.description,
    tier: a.tier,
  })),
];

export function titleById(id: string): ProfileTitleDef | undefined {
  return PROFILE_TITLES.find((t) => t.id === id);
}

export function achievementByKey(key: string): UnifiedAchievementDef | undefined {
  return UNIFIED_ACHIEVEMENTS.find((a) => a.key === key);
}

export function allCosmetics(): CosmeticDef[] {
  return [
    ...PROFILE_THEMES,
    ...PROFILE_BORDERS,
    ...PROFILE_GLOWS,
    ...PROFILE_BACKGROUNDS,
    ...PROFILE_PARTICLES,
    ...VIBE_FACES,
  ];
}

export function cosmeticsByType(type: CosmeticType): CosmeticDef[] {
  return allCosmetics().filter((c) => c.type === type);
}

export function cosmeticById(type: CosmeticType, id: string): CosmeticDef | undefined {
  return cosmeticsByType(type).find((c) => c.id === id);
}

export const TITLE_RARITY_CLASS: Record<TitleRarity, string> = {
  common: "text-white/70",
  rare: "text-shimmer",
  legendary: "text-transparent bg-clip-text bg-gradient-to-r from-gvc-gold via-pink-accent to-gvc-gold",
};

export const ARCADE_TIER_CLASS: Record<ArcadeTier, string> = {
  Rookie: "border-white/20 text-white/60",
  Regular: "border-gvc-gold/30 text-gvc-gold/80",
  Crusher: "border-gvc-gold/50 text-gvc-gold",
  Legend: "border-pink-accent/50 text-shimmer",
};
