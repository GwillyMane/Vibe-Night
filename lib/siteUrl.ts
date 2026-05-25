/** Normalize env/host values into a full origin (with protocol). */
export function normalizeSiteOrigin(raw?: string | null): string {
  const trimmed = raw?.trim().replace(/\/$/, "");
  if (trimmed) {
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/** Server-safe app origin for metadata and OG URLs. */
export function siteOrigin(): string {
  return normalizeSiteOrigin(process.env.NEXT_PUBLIC_APP_URL);
}

export function siteMetadataBase(): URL {
  return new URL(siteOrigin());
}

export function absoluteUrl(path: string): string {
  const base = siteOrigin();
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
