/**
 * Official GVC brand faces from https://goodvibesclub.ai/api/brand?category=faces
 * (served via Vercel Blob — reliable HTTPS + CORS for canvas and next/image).
 */
export const BAD_VIBE_FACE_URL =
  "https://aagrmr5pocteyhfg.public.blob.vercel-storage.com/brand-assets/faces/1776711654833-GVC_FACE_Purple_Mishchevious.webp";

/** Good-vibe projectile options (library “Faces”; purple is reserved for targets). */
export const GOOD_VIBE_FACE_SKINS = [
  {
    slug: "yellow-puppy",
    label: "Yellow puppy",
    url: "https://aagrmr5pocteyhfg.public.blob.vercel-storage.com/brand-assets/faces/1776711653777-GVC_FACE_Yellow_PuppyHappy.webp",
  },
  {
    slug: "red-happy",
    label: "Red happy",
    url: "https://aagrmr5pocteyhfg.public.blob.vercel-storage.com/brand-assets/faces/1776711654361-GVC_FACE_Red_Happy.webp",
  },
  {
    slug: "pink-laugh",
    label: "Pink laugh",
    url: "https://aagrmr5pocteyhfg.public.blob.vercel-storage.com/brand-assets/faces/1776711655304-GVC_FACE_Pink_Laugh.webp",
  },
  {
    slug: "mint-dead",
    label: "Mint deadpan",
    url: "https://aagrmr5pocteyhfg.public.blob.vercel-storage.com/brand-assets/faces/1776711655882-GVC_FACE_Mint_Dead.webp",
  },
  {
    slug: "blue-meditation",
    label: "Blue calm",
    url: "https://aagrmr5pocteyhfg.public.blob.vercel-storage.com/brand-assets/faces/1776711656314-GVC_FACE_Blue_Meditation.webp",
  },
] as const;

export type GoodVibeFaceSlug = (typeof GOOD_VIBE_FACE_SKINS)[number]["slug"];

export function urlForGoodVibeFaceSlug(slug: string): string | undefined {
  const row = GOOD_VIBE_FACE_SKINS.find((f) => f.slug === slug);
  return row?.url;
}
