import { GVC_LIBRARY_FACE_URLS } from "@/lib/assets/gvcLibraryFaces";
import { imageUrlForToken, loadTokensMetadata } from "@/lib/assets/gvcMetadata";
import {
  FEATURE_SYMBOL_NAMES,
  LUCKY_SPINS_SYMBOL_URL,
  PREMIUM_TOKEN_IDS,
  TOKEN_DISPLAY_NAMES,
  VIBE_LOCK_SYMBOL_URL,
  type FaceId,
  type SymbolId,
} from "./luckyConfig";

export interface SymbolAsset {
  symbol: SymbolId;
  label: string;
  imageUrl: string | null;
  accent: string;
}

const FACE_ACCENTS = ["#FF5F1F", "#FFE048", "#2EFF2E", "#6B9DFF", "#FF6B9D", "#B06BFF"];

const imageCache = new Map<string, HTMLImageElement>();

export function loadImage(url: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(url);
  if (cached?.complete && cached.naturalWidth > 0) return Promise.resolve(cached);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageCache.set(url, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
}

export async function preloadLuckyAssets(): Promise<Map<SymbolId, SymbolAsset>> {
  const map = new Map<SymbolId, SymbolAsset>();

  for (let i = 0; i < 6; i++) {
    const sym = `face:${i}` as SymbolId;
    const url = GVC_LIBRARY_FACE_URLS[i]!;
    map.set(sym, { symbol: sym, label: `Face ${i}`, imageUrl: url, accent: FACE_ACCENTS[i]! });
    await loadImage(url).catch(() => undefined);
  }

  const meta = await loadTokensMetadata([...PREMIUM_TOKEN_IDS]);
  for (const id of PREMIUM_TOKEN_IDS) {
    const sym = `token:${id}` as SymbolId;
    const m = meta[id];
    const url = imageUrlForToken(m) || null;
    map.set(sym, {
      symbol: sym,
      label: TOKEN_DISPLAY_NAMES[id],
      imageUrl: url,
      accent: "#FFE048",
    });
    if (url) await loadImage(url).catch(() => undefined);
  }

  map.set("wild", { symbol: "wild", label: "Wild", imageUrl: "/shaka.png", accent: "#FFE048" });
  await loadImage("/shaka.png").catch(() => undefined);

  map.set("scatter", {
    symbol: "scatter",
    label: FEATURE_SYMBOL_NAMES.scatter,
    imageUrl: LUCKY_SPINS_SYMBOL_URL,
    accent: "#FF6B9D",
  });
  await loadImage(LUCKY_SPINS_SYMBOL_URL).catch(() => undefined);

  map.set("orb", {
    symbol: "orb",
    label: FEATURE_SYMBOL_NAMES.orb,
    imageUrl: VIBE_LOCK_SYMBOL_URL,
    accent: "#6B9DFF",
  });
  await loadImage(VIBE_LOCK_SYMBOL_URL).catch(() => undefined);

  map.set("blank", { symbol: "blank", label: "Empty", imageUrl: null, accent: "#1F1F1F" });

  return map;
}

export function faceIdFromSymbol(sym: SymbolId): FaceId | null {
  if (!sym.startsWith("face:")) return null;
  return Number(sym.slice(5)) as FaceId;
}

export function getCachedImage(url: string | null): HTMLImageElement | null {
  if (!url) return null;
  const img = imageCache.get(url);
  if (!img?.complete || img.naturalWidth <= 0) return null;
  return img;
}
