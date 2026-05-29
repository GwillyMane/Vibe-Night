import { ACHIEVEMENTS } from "@/lib/achievements";
import type { GameId } from "@/lib/games/catalog";
import { CATCH_ACHIEVEMENTS } from "@/lib/catch-a-vibe/catchAchievements";
import { LUCKY_ACHIEVEMENTS } from "@/lib/lucky-vibes/luckyAchievements";
import type { AchievementTier, ProfileTitleDef, TitleRarity } from "../catalog";
import { GARDEN_ACHIEVEMENTS } from "@/lib/vibe-garden/gardenAchievements";
import { MERGE_ACHIEVEMENTS } from "@/lib/vibe-merge/mergeAchievements";
import { SHIFT_ACHIEVEMENTS } from "@/lib/vibe-shift/shiftAchievements";
import { gameTitleId, gameTitleLabel } from "./gameTitleLabels";

function tierToRarity(tier: AchievementTier): TitleRarity {
  switch (tier) {
    case "bronze":
      return "common";
    case "silver":
    case "gold":
      return "rare";
    case "cosmic":
      return "legendary";
    default:
      return "common";
  }
}

function buildForGame(
  gameId: GameId,
  achievements: Array<{ slug: string; tier: AchievementTier }>,
): ProfileTitleDef[] {
  return achievements.map((a) => ({
    id: gameTitleId(gameId, a.slug),
    label: gameTitleLabel(gameId, a.slug),
    rarity: tierToRarity(a.tier),
    gameId,
    category: "game" as const,
    unlockRule: "achievement" as const,
    unlockParams: { gameId, slug: a.slug },
  }));
}

export function buildGameTitles(): ProfileTitleDef[] {
  return [
    ...buildForGame("vibe-crashers", ACHIEVEMENTS),
    ...buildForGame("vibe-merge", MERGE_ACHIEVEMENTS),
    ...buildForGame("vibe-garden", GARDEN_ACHIEVEMENTS),
    ...buildForGame("catch-a-vibe", CATCH_ACHIEVEMENTS),
    ...buildForGame("vibe-shift", SHIFT_ACHIEVEMENTS),
    ...buildForGame("lucky-vibes", LUCKY_ACHIEVEMENTS),
  ];
}
