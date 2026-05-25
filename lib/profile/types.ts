import type { ArcadeTier, CosmeticType, TitleRarity } from "./catalog";

export interface ProfileStreak {
  currentStreak: number;
  longestStreak: number;
  lastPlayDate: string | null;
}

export interface ProfileStatChip {
  id: string;
  label: string;
  value: string;
}

export interface PinnedBadge {
  slot: number;
  badgeKey: string;
}

export interface ActivityItem {
  id: string;
  kind: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface PublicProfile {
  username: string;
  joinDate: string;
  lastActiveAt: string | null;
  isActiveRecently: boolean;
  avatarFaceId: string;
  equippedTitleId: string;
  equippedTitleLabel: string;
  titleRarity: TitleRarity;
  featuredBadgeKey: string | null;
  favoriteGameId: string | null;
  favoriteGameLabel: string | null;
  themeId: string;
  borderId: string;
  glowId: string;
  backgroundId: string;
  particleId: string;
  vibeRank: number;
  arcadeTier: ArcadeTier;
  streak: ProfileStreak;
  stats: ProfileStatChip[];
  pinnedBadges: PinnedBadge[];
  recentActivity: ActivityItem[];
  achievementCount: number;
  isOwner: boolean;
  passportUrl: string | null;
  passportGeneratedAt: string | null;
}

export interface ProfileMe extends PublicProfile {
  userId: string;
  ownedTitleIds: string[];
  ownedCosmetics: Array<{ type: CosmeticType; id: string }>;
  unlockedAchievementKeys: string[];
}

export interface CollectionItem {
  id: string;
  label: string;
  type?: CosmeticType;
  rarity?: TitleRarity | string;
  unlocked: boolean;
  equipped?: boolean;
  imageUrl?: string;
  description?: string;
  tier?: string;
  gameId?: string;
}

export interface CollectionsSnapshot {
  titles: CollectionItem[];
  badges: CollectionItem[];
  faces: CollectionItem[];
  themes: CollectionItem[];
  borders: CollectionItem[];
  glows: CollectionItem[];
  backgrounds: CollectionItem[];
  particles: CollectionItem[];
}

export interface GameStatsJson {
  bestClassic?: number;
  bestDaily?: number;
  highestTierEver?: number;
  totalMerges?: number;
  maxCombo?: number;
  levelsCleared?: number;
  totalPlants?: number;
  maxBloomChain?: number;
  cleanses?: number;
  goldBlooms?: number;
  totalCatches?: number;
  bloomChains?: number;
  badDodged?: number;
  goldenCatches?: number;
  glassBreaks?: number;
  structuresDestroyed?: number;
  bestTargetsOneLaunch?: number;
  bestBlocksOneLaunch?: number;
  hasOneShotWin?: boolean;
  bestCleansesInRun?: number;
  bestBadDodgedInRun?: number;
  hasGoldenCascade?: boolean;
  dailyWins?: number;
  runs?: number;
  zenParticipation?: number;
  classicWins?: number;
  dailyPlays?: number;
  totalClears?: number;
  maxCascade?: number;
  bestLevelReached?: number;
  totalSpins?: number;
  totalLineWins?: number;
  luckySpinsTriggered?: number;
  vibeLockTriggered?: number;
  grandVibes?: number;
  bestSingleSpin?: number;
  bestStreak?: number;
  maxMultiplier?: number;
}

export interface UnlockContext {
  achievementKeys: Set<string>;
  ownedTitleIds: Set<string>;
  ownedCosmetics: Set<string>;
  streak: ProfileStreak;
  vibeRank: number;
  arcadeTier: ArcadeTier;
  gameStats: Record<string, GameStatsJson>;
  gamesWithScores: Set<string>;
}
