import { urlForGoodVibeFaceSlug } from "./gvcBrandFaces";

export type ProjectileSkinId =
  | "shaka"
  | "gold"
  | "badge"
  | `token:${string}`
  | `face:${string}`;

const STORAGE_KEY = "vibe-sling:projectile-skin";

export const DEFAULT_PROJECTILE_SKIN: ProjectileSkinId = "shaka";

export function parseProjectileSkinId(raw: string | null | undefined): ProjectileSkinId {
  if (!raw) return DEFAULT_PROJECTILE_SKIN;
  if (raw === "shaka" || raw === "gold" || raw === "badge") return raw;
  if (raw.startsWith("token:")) return raw as ProjectileSkinId;
  if (raw.startsWith("face:")) {
    const slug = raw.slice(5);
    return urlForGoodVibeFaceSlug(slug) ? (raw as ProjectileSkinId) : DEFAULT_PROJECTILE_SKIN;
  }
  return DEFAULT_PROJECTILE_SKIN;
}

export function loadProjectileSkinFromStorage(): ProjectileSkinId {
  if (typeof window === "undefined") return DEFAULT_PROJECTILE_SKIN;
  try {
    return parseProjectileSkinId(localStorage.getItem(STORAGE_KEY));
  } catch {
    return DEFAULT_PROJECTILE_SKIN;
  }
}

export function saveProjectileSkinToStorage(id: ProjectileSkinId): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}

/**
 * URL for canvas draw: null = draw procedural gold orb; string = try ImageBitmap/img
 */
export function projectileTextureUrlForSkin(
  skin: ProjectileSkinId,
  tokenImageById: Record<string, string>
): string | null {
  if (skin === "gold") return null;
  if (skin === "badge") return null;
  if (skin === "shaka") return "/shaka.png";
  if (skin.startsWith("token:")) {
    const id = skin.slice(6);
    const u = tokenImageById[id];
    return u && u.length > 0 ? u : "/shaka.png";
  }
  if (skin.startsWith("face:")) {
    const slug = skin.slice(5);
    return urlForGoodVibeFaceSlug(slug) ?? "/shaka.png";
  }
  return "/shaka.png";
}

export function isProceduralOrbSkin(skin: ProjectileSkinId): boolean {
  return skin === "gold" || skin === "badge";
}

/** Bitmap skins that should render as a circle on canvas and in the picker. */
export function projectileUsesCircularMask(skin: ProjectileSkinId): boolean {
  return skin.startsWith("face:") || skin.startsWith("token:");
}
