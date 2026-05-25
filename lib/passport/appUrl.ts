/** Resolve absolute app origin for OG asset URLs and profile links. */
export function resolveAppOrigin(request?: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (request) {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    const proto = request.headers.get("x-forwarded-proto") ?? "http";
    if (host) return `${proto}://${host}`;
  }
  return "http://localhost:3000";
}
