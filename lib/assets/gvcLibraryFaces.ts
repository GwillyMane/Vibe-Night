/** Official GVC library face URLs (tiers 1–6 / flow colors 0–5). */
export const GVC_LIBRARY_FACE_URLS = [
  "https://aagrmr5pocteyhfg.public.blob.vercel-storage.com/brand-assets/faces/1776711654361-GVC_FACE_Red_Happy.webp",
  "https://aagrmr5pocteyhfg.public.blob.vercel-storage.com/brand-assets/faces/1776711653777-GVC_FACE_Yellow_PuppyHappy.webp",
  "https://aagrmr5pocteyhfg.public.blob.vercel-storage.com/brand-assets/faces/1776711655882-GVC_FACE_Mint_Dead.webp",
  "https://aagrmr5pocteyhfg.public.blob.vercel-storage.com/brand-assets/faces/1776711656314-GVC_FACE_Blue_Meditation.webp",
  "https://aagrmr5pocteyhfg.public.blob.vercel-storage.com/brand-assets/faces/1776711655304-GVC_FACE_Pink_Laugh.webp",
  "https://aagrmr5pocteyhfg.public.blob.vercel-storage.com/brand-assets/faces/1776711654833-GVC_FACE_Purple_Mishchevious.webp",
] as const;

export type GvcLibraryColorId = 0 | 1 | 2 | 3 | 4 | 5;

export const GVC_COLOR_COUNT = 6;

export const GVC_COLOR_LABELS = ["Red", "Yellow", "Mint", "Blue", "Pink", "Purple"] as const;

export const GVC_COLOR_ACCENT = [
  "#FF5F1F",
  "#FFE048",
  "#2EFF2E",
  "#6B9DFF",
  "#FF6B9D",
  "#B06BFF",
] as const;
