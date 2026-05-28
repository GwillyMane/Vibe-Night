import { ipfsToHttp } from "./ipfs";

export interface GvcTokenMeta {
  name?: string;
  image?: string;
  description?: string;
}

/** Curated demo tokens for the “Choose Vibe” selector (GVC only). */
export const DEMO_GVC_TOKEN_IDS = ["142", "3933", "420", "1234", "572", "6968"] as const;

const tokenCache = new Map<string, GvcTokenMeta>();

export function imageUrlForToken(meta: GvcTokenMeta | undefined): string {
  if (!meta?.image) return "";
  return ipfsToHttp(meta.image);
}

async function fetchTokenMetadata(ids: string[]): Promise<Record<string, GvcTokenMeta>> {
  const missing = ids.filter((id) => !tokenCache.has(id));
  if (missing.length) {
    const res = await fetch(`/api/gvc-metadata?ids=${missing.join(",")}`);
    if (res.ok) {
      const data = (await res.json()) as Record<string, GvcTokenMeta>;
      for (const [id, meta] of Object.entries(data)) {
        tokenCache.set(id, meta);
      }
    }
  }
  const out: Record<string, GvcTokenMeta> = {};
  for (const id of ids) {
    const m = tokenCache.get(id);
    if (m) out[id] = m;
  }
  return out;
}

/** Load metadata for specific token IDs via the server subset API. */
export async function loadTokensMetadata(ids: string[]): Promise<Record<string, GvcTokenMeta>> {
  return fetchTokenMetadata(ids);
}

export async function getTokenMetadata(tokenId: string): Promise<GvcTokenMeta | undefined> {
  const map = await fetchTokenMetadata([tokenId]);
  return map[tokenId];
}

export async function getDemoTokenEntries(): Promise<
  { id: string; name: string; imageUrl: string }[]
> {
  const all = await fetchTokenMetadata([...DEMO_GVC_TOKEN_IDS]);
  return DEMO_GVC_TOKEN_IDS.map((id) => {
    const m = all[id];
    const imageUrl = imageUrlForToken(m);
    const name = m?.name ?? `GVC #${id}`;
    return { id, name, imageUrl };
  });
}
