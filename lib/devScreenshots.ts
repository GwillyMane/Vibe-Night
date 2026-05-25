import { assetPublicUrl } from "@/lib/supabase/assetStorage";

/** Dev/marketing screenshots — hosted on Supabase `vibe-night-assets` bucket. */
export const DEV_SCREENSHOT_FILES = [
  "Screenshot (169).png",
  "Screenshot (170).png",
  "Screenshot (171).png",
  "Screenshot (173).png",
  "Screenshot (178).png",
  "Screenshot (179).png",
] as const;

export type DevScreenshotFile = (typeof DEV_SCREENSHOT_FILES)[number];

const OBJECT_PREFIX = "dev-screenshots";

export function devScreenshotObjectPath(filename: DevScreenshotFile): string {
  return `${OBJECT_PREFIX}/${filename}`;
}

export function devScreenshotUrl(filename: DevScreenshotFile): string {
  if (!process.env.SUPABASE_URL) {
    return `/games/vibe-crashers-preview.png`;
  }
  return assetPublicUrl(devScreenshotObjectPath(filename));
}

export function getDevScreenshotUrls(): Record<DevScreenshotFile, string> {
  return Object.fromEntries(DEV_SCREENSHOT_FILES.map((f) => [f, devScreenshotUrl(f)])) as Record<
    DevScreenshotFile,
    string
  >;
}
