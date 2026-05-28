import { NextRequest, NextResponse } from "next/server";
import { clientIp, rateLimitCheck } from "@/lib/rateLimit";

const GATEWAYS = [
  "https://cloudflare-ipfs.com/ipfs/",
  "https://ipfs.io/ipfs/",
  "https://w3s.link/ipfs/",
];

function normalizeIpfsPath(p: string): string | null {
  let raw: string;
  try {
    raw = decodeURIComponent(p).trim().replace(/^\/+/, "");
  } catch {
    return null;
  }
  if (!raw || raw.length > 480 || raw.includes("..")) return null;
  return raw;
}

export async function GET(req: NextRequest) {
  if (!(await rateLimitCheck(`ipfs:ip:${clientIp(req)}`, 120, 60_000))) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }
  const p = req.nextUrl.searchParams.get("p");
  if (!p) return NextResponse.json({ error: "missing p" }, { status: 400 });
  const path = normalizeIpfsPath(p);
  if (!path) return NextResponse.json({ error: "invalid path" }, { status: 400 });

  for (const base of GATEWAYS) {
    try {
      const r = await fetch(base + path, {
        redirect: "follow",
        headers: { Accept: "image/*,*/*" },
      });
      if (!r.ok) continue;
      const ab = await r.arrayBuffer();
      if (ab.byteLength < 16 || ab.byteLength > 12 * 1024 * 1024) continue;
      let ct = r.headers.get("content-type") ?? "";
      if (!ct.startsWith("image/")) {
        const lower = path.toLowerCase();
        if (lower.endsWith(".png")) ct = "image/png";
        else if (lower.endsWith(".webp")) ct = "image/webp";
        else if (lower.endsWith(".gif")) ct = "image/gif";
        else ct = "image/jpeg";
      }
      return new NextResponse(ab, {
        status: 200,
        headers: {
          "Content-Type": ct,
          "Cache-Control": "public, max-age=86400, s-maxage=86400",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch {
      continue;
    }
  }

  return NextResponse.json({ error: "all gateways failed" }, { status: 502 });
}
