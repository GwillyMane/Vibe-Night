/**
 * Resolve IPFS (and common /ipfs/ HTTPS URLs) to a same-origin proxy so:
 * - Canvas can use crossOrigin="anonymous" reliably
 * - next/image works without remotePatterns for every gateway
 *
 * Proxy: GET /api/ipfs-proxy?p=<cid[/path...]>
 */
export function ipfsToHttp(url: string): string {
  if (!url || typeof url !== "string") return "";
  const u = url.trim();
  if (!u) return "";

  if (u.startsWith("ipfs://")) {
    const path = u.slice(7).replace(/^\/+/, "");
    return path ? `/api/ipfs-proxy?p=${encodeURIComponent(path)}` : "";
  }

  try {
    const parsed = new URL(u);
    const mark = "/ipfs/";
    const idx = parsed.pathname.indexOf(mark);
    if (idx !== -1) {
      const path = parsed.pathname.slice(idx + mark.length);
      if (path) return `/api/ipfs-proxy?p=${encodeURIComponent(path)}`;
    }
  } catch {
    /* ignore */
  }

  return u;
}
