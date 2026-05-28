import { GVC_LIBRARY_FACE_URLS } from "@/lib/assets/gvcLibraryFaces";
import { imageUrlForToken, loadTokensMetadata } from "@/lib/assets/gvcMetadata";
import { MERGE_TIER_TOKEN_IDS, type MergeTierId } from "./mergeConfig";

const cache = new Map<number, HTMLImageElement>();

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export async function preloadMergeFaces(): Promise<void> {
  if (typeof window === "undefined") return;

  const loads: { tier: MergeTierId; url: string }[] = [];
  for (const tier of [1, 2, 3, 4, 5, 6] as const) {
    loads.push({ tier, url: GVC_LIBRARY_FACE_URLS[tier - 1]! });
  }

  const meta = await loadTokensMetadata(
    ([7, 8, 9, 10] as const).map((tier) => MERGE_TIER_TOKEN_IDS[tier])
  );
  for (const tier of [7, 8, 9, 10] as const) {
    const url = imageUrlForToken(meta[MERGE_TIER_TOKEN_IDS[tier]]);
    if (url) loads.push({ tier, url });
  }

  await Promise.all(
    loads.map(async ({ tier, url }) => {
      const img = await loadImage(url);
      if (img) cache.set(tier, img);
    })
  );
}

export function getTierFaceImage(tier: MergeTierId): HTMLImageElement | undefined {
  return cache.get(tier);
}
