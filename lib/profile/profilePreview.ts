import { GAME_LIBRARY } from "@/lib/games/catalog";
import { titleById, type TitleRarity } from "./catalog";
import type { PublicProfile, PinnedBadge } from "./types";

export type ProfileCustomizationDraft = {
  avatarFaceId?: string;
  equippedTitleId?: string;
  featuredBadgeKey?: string | null;
  favoriteGameId?: string | null;
  themeId?: string;
  borderId?: string;
  glowId?: string;
  backgroundId?: string;
  particleId?: string;
  pinnedBadges?: PinnedBadge[];
};

export function mergeProfilePreview(base: PublicProfile, draft: ProfileCustomizationDraft): PublicProfile {
  const equippedTitleId = draft.equippedTitleId ?? base.equippedTitleId;
  const title = titleById(equippedTitleId);
  const favoriteGameId = draft.favoriteGameId !== undefined ? draft.favoriteGameId : base.favoriteGameId;

  return {
    ...base,
    avatarFaceId: draft.avatarFaceId ?? base.avatarFaceId,
    equippedTitleId,
    equippedTitleLabel: title?.label ?? base.equippedTitleLabel,
    titleRarity: (title?.rarity ?? base.titleRarity) as TitleRarity,
    featuredBadgeKey: draft.featuredBadgeKey !== undefined ? draft.featuredBadgeKey : base.featuredBadgeKey,
    favoriteGameId,
    favoriteGameLabel: favoriteGameId
      ? (GAME_LIBRARY.find((g) => g.id === favoriteGameId)?.shortTitle ?? base.favoriteGameLabel)
      : base.favoriteGameLabel,
    themeId: draft.themeId ?? base.themeId,
    borderId: draft.borderId ?? base.borderId,
    glowId: draft.glowId ?? base.glowId,
    backgroundId: draft.backgroundId ?? base.backgroundId,
    particleId: draft.particleId ?? base.particleId,
    pinnedBadges: draft.pinnedBadges ?? base.pinnedBadges,
  };
}
