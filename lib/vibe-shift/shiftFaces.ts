import { GVC_LIBRARY_FACE_URLS } from "@/lib/assets/gvcLibraryFaces";
import type { ShiftColorId } from "./shiftConfig";

const cache = new Map<ShiftColorId, HTMLImageElement>();

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export async function preloadShiftFaces(): Promise<void> {
  if (typeof window === "undefined") return;
  await Promise.all(
    GVC_LIBRARY_FACE_URLS.map(async (url, i) => {
      const img = await loadImage(url);
      if (img) cache.set(i as ShiftColorId, img);
    })
  );
}

export function getShiftFaceImage(colorId: ShiftColorId): HTMLImageElement | undefined {
  return cache.get(colorId);
}
