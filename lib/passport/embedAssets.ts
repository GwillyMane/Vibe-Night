import { readFile } from "fs/promises";
import path from "path";
import type { PublicProfile } from "@/lib/profile/types";
import { passportAvatarUrl, passportBadgeUrl } from "./assetUrls";

/** Satori requires raster images it can decode — normalize everything to PNG data URLs. */
async function fetchAsPngDataUrl(url: string): Promise<string> {
  let buf: Buffer;
  const origin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  if (url.startsWith(`${origin}/`) || url.startsWith("/")) {
    const pathname = url.startsWith("/") ? url : new URL(url).pathname;
    const localPath = path.join(process.cwd(), "public", pathname.replace(/^\//, ""));
    buf = await readFile(localPath);
  } else {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12_000);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`Failed to fetch asset: ${url} (${res.status})`);
      buf = Buffer.from(await res.arrayBuffer());
    } finally {
      clearTimeout(timer);
    }
  }
  const sharp = (await import("sharp")).default;
  const png = await sharp(buf).png().toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}

export type PassportEmbeddedAssets = {
  avatarSrc: string;
  featuredSrc: string | null;
  badgeSrcs: string[];
};

export async function embedPassportAssets(profile: PublicProfile, origin: string): Promise<PassportEmbeddedAssets> {
  const avatarSrc = await fetchAsPngDataUrl(passportAvatarUrl(origin, profile.avatarFaceId));
  const featuredSrc = profile.featuredBadgeKey
    ? await fetchAsPngDataUrl(passportBadgeUrl(origin, profile.featuredBadgeKey))
    : null;

  const pinKeys =
    profile.pinnedBadges.length > 0
      ? profile.pinnedBadges.slice(0, 4).map((p) => p.badgeKey)
      : profile.featuredBadgeKey
        ? [profile.featuredBadgeKey]
        : [];

  const badgeSrcs = await Promise.all(pinKeys.map((k) => fetchAsPngDataUrl(passportBadgeUrl(origin, k))));

  return { avatarSrc, featuredSrc, badgeSrcs };
}
