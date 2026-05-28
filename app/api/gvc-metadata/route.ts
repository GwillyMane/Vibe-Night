import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

let fullCache: Record<string, unknown> | null = null;

async function loadFullMetadata(): Promise<Record<string, unknown>> {
  if (fullCache) return fullCache;
  const filePath = path.join(process.cwd(), "public", "gvc-metadata.json");
  const raw = await readFile(filePath, "utf8");
  fullCache = JSON.parse(raw) as Record<string, unknown>;
  return fullCache;
}

/** Return metadata for specific token IDs without shipping the full 6,969-token JSON to the client. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get("ids");
  if (!idsParam) {
    return NextResponse.json({ error: "ids query param required" }, { status: 400 });
  }

  const ids = idsParam
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^\d+$/.test(s) && s.length <= 5)
    .slice(0, 32);

  if (!ids.length) {
    return NextResponse.json({ error: "No valid token ids" }, { status: 400 });
  }

  try {
    const all = await loadFullMetadata();
    const out: Record<string, unknown> = {};
    for (const id of ids) {
      if (all[id]) out[id] = all[id];
    }
    return NextResponse.json(out, {
      headers: { "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800" },
    });
  } catch (e) {
    console.error("[GET /api/gvc-metadata]", e);
    return NextResponse.json({ error: "Could not load metadata." }, { status: 500 });
  }
}
