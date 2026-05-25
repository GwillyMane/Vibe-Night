import { ipfsToHttp } from "./ipfs";

export interface GvcTokenMeta {
  name?: string;
  image?: string;
  description?: string;
}

/** Curated demo tokens for the “Choose Vibe” selector (GVC only). */
export const DEMO_GVC_TOKEN_IDS = ["142", "3933", "420", "1234", "572", "6968"] as const;

let metadataCache: Record<string, GvcTokenMeta> | null = null;

export async function loadGvcMetadata(): Promise<Record<string, GvcTokenMeta>> {
  if (metadataCache) return metadataCache;
  try {
    const res = await fetch("/gvc-metadata.json");
    if (!res.ok) {
      metadataCache = {};
      return metadataCache;
    }
    metadataCache = (await res.json()) as Record<string, GvcTokenMeta>;
    return metadataCache;
  } catch {
    metadataCache = {};
    return metadataCache;
  }
}

export function imageUrlForToken(meta: GvcTokenMeta | undefined): string {
  if (!meta?.image) return "";
  return ipfsToHttp(meta.image);
}

export async function getDemoTokenEntries(): Promise<
  { id: string; name: string; imageUrl: string }[]
> {
  const all = await loadGvcMetadata();
  return DEMO_GVC_TOKEN_IDS.map((id) => {
    const m = all[id];
    const imageUrl = imageUrlForToken(m);
    const name = m?.name ?? `GVC #${id}`;
    return { id, name, imageUrl };
  });
}
