import { normalizeSiteOrigin } from "@/lib/siteUrl";

/** Resolve absolute app origin for OG asset URLs and profile links. */
export function resolveAppOrigin(request?: Request): string {
  const fromEnv = normalizeSiteOrigin(process.env.NEXT_PUBLIC_APP_URL);
  if (process.env.NEXT_PUBLIC_APP_URL?.trim()) return fromEnv;
  if (request) {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    const proto = request.headers.get("x-forwarded-proto") ?? "https";
    if (host) return `${proto}://${host}`;
  }
  return fromEnv;
}
