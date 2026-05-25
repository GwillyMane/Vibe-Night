const B = "https://aagrmr5pocteyhfg.public.blob.vercel-storage.com/brand-assets/backgrounds";

/**
 * Level 1 — [Vibetown_Nature_01](https://goodvibesclub.ai/library) (GVC brand library).
 * Source: GET https://goodvibesclub.ai/api/brand?category=backgrounds
 */
export const LEVEL1_BACKGROUND_URL = `${B}/1776711580882-Vibetown_Nature_01.webp`;

const DAILY_LIBRARY_BACKGROUNDS = [
  `${B}/1776711579264-Vibetown_StreetView.webp`,
  `${B}/1776711578753-Vibetown_Wide_Dusk_02.webp`,
  `${B}/1776711580382-Vibetown_Nature_02.webp`,
  `${B}/1776711581391-Vibetown_Day_Medium.webp`,
  `${B}/1776711581852-Vibetown_Beachhouse.webp`,
  `${B}/1776711595943-CloseNature_01.webp`,
  `${B}/1776711577516-Vibetown_Wide.webp`,
  `${B}/1776711583783-Vibetown_Beach_Wide_01.webp`,
  `${B}/1776711573481-Vibetown_SidewalkPark.webp`,
  `${B}/1776711574104-BeachShack_02.webp`,
] as const;

const LEVEL_BACKGROUNDS: Record<string, string> = {
  "1": LEVEL1_BACKGROUND_URL,
  "2": `${B}/1776711579264-Vibetown_StreetView.webp`,
  "3": `${B}/1776711580382-Vibetown_Nature_02.webp`,
  "4": `${B}/1776711581391-Vibetown_Day_Medium.webp`,
  "5": `${B}/1776711581852-Vibetown_Beachhouse.webp`,
};

for (let i = 6; i <= 20; i++) {
  const id = String(i);
  LEVEL_BACKGROUNDS[id] = DAILY_LIBRARY_BACKGROUNDS[(i - 6) % DAILY_LIBRARY_BACKGROUNDS.length] ?? DAILY_LIBRARY_BACKGROUNDS[0];
}

/** Backdrop for the resolved handcrafted level id (campaign or daily). */
export function levelBackgroundUrl(levelId: string, _seed: string, _kind: "handcrafted" | "daily"): string {
  return LEVEL_BACKGROUNDS[levelId] ?? LEVEL1_BACKGROUND_URL;
}
