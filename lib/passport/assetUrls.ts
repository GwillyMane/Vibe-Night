import { urlForGoodVibeFaceSlug } from "@/lib/assets/gvcBrandFaces";
import { rewardBadgeUrlForKey, REWARD_BADGE_FALLBACK_SRC } from "@/lib/gvcRewardBadges";

export function absoluteAssetUrl(origin: string, pathOrUrl: string): string {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) return pathOrUrl;
  return `${origin}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

export function passportAvatarUrl(origin: string, faceId: string): string {
  if (faceId === "shaka") return absoluteAssetUrl(origin, "/shaka.png");
  const url = urlForGoodVibeFaceSlug(faceId);
  return url ?? absoluteAssetUrl(origin, REWARD_BADGE_FALLBACK_SRC);
}

export function passportBadgeUrl(origin: string, badgeKey: string | null | undefined): string {
  if (!badgeKey) return absoluteAssetUrl(origin, REWARD_BADGE_FALLBACK_SRC);
  const url = rewardBadgeUrlForKey(badgeKey);
  return url ?? absoluteAssetUrl(origin, REWARD_BADGE_FALLBACK_SRC);
}
