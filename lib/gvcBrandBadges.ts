import badgeUrls from "../public/gvc-brand-badges.json";

export const GVC_BRAND_BADGE_URLS = badgeUrls as Record<string, string>;

export function badgeUrlForSlug(slug: string): string | undefined {
  const key = slug.endsWith(".webp") ? slug : `${slug}.webp`;
  return GVC_BRAND_BADGE_URLS[key];
}
