import { GVC_LIBRARY_FACE_URLS } from "@/lib/assets/gvcLibraryFaces";
import type { GardenColorId } from "./gardenConfig";

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

export async function preloadGardenFaces(): Promise<void> {
  if (typeof window === "undefined") return;
  await Promise.all(
    GVC_LIBRARY_FACE_URLS.map(async (url, i) => {
      const img = await loadImage(url);
      if (img) cache.set(i, img);
    })
  );
}

export function getGardenFaceImage(colorId: GardenColorId): HTMLImageElement | undefined {
  if (colorId === 6) return cache.get(1); // gold uses yellow face + halo
  return cache.get(colorId);
}
