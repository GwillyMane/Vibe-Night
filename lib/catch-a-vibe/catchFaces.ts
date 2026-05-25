import { GVC_LIBRARY_FACE_URLS } from "@/lib/assets/gvcLibraryFaces";
import { ipfsToHttp } from "@/lib/assets/ipfs";
import { BAD_VIBES_GUY_TOKEN_ID } from "./catchConfig";
import type { CatchColorId } from "./catchConfig";

const cache = new Map<number, HTMLImageElement>();
let badVibeImg: HTMLImageElement | null = null;

/** GVC #4113 — Bad Vibes Guy */
const BAD_VIBE_IMAGE_URL = ipfsToHttp(
  "ipfs://QmY6JpwTYx6zZHgfJb3gPJRh1U897NX4RudtK5jhJ3sNDS/4113.jpg"
);

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export async function preloadCatchFaces(): Promise<void> {
  if (typeof window === "undefined") return;
  await Promise.all([
    ...GVC_LIBRARY_FACE_URLS.map(async (url, i) => {
      const img = await loadImage(url);
      if (img) cache.set(i, img);
    }),
    loadImage(BAD_VIBE_IMAGE_URL).then((img) => {
      if (img) badVibeImg = img;
    }),
  ]);
}

export function getCatchFaceImage(colorId: CatchColorId): HTMLImageElement | undefined {
  if (colorId === 6) return cache.get(1);
  return cache.get(colorId);
}

export function getBadVibeFaceImage(): HTMLImageElement | null {
  return badVibeImg;
}

export { BAD_VIBES_GUY_TOKEN_ID, BAD_VIBE_IMAGE_URL };
