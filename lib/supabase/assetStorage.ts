import { getSupabaseAdmin, supabaseConfigured } from "./client";

/** Public CDN bucket for dev/marketing screenshots and static assets. */
export const ASSETS_BUCKET = "vibe-night-assets";

export function assetPublicUrl(objectPath: string): string {
  const url = process.env.SUPABASE_URL;
  if (!url) throw new Error("SUPABASE_URL is not configured.");
  const clean = objectPath.replace(/^\/+/, "");
  return `${url}/storage/v1/object/public/${ASSETS_BUCKET}/${clean}`;
}

export async function ensureAssetsBucket(): Promise<void> {
  if (!supabaseConfigured()) throw new Error("Supabase is not configured.");
  const supabase = getSupabaseAdmin();
  const { data: buckets } = await supabase.storage.listBuckets();
  if (buckets?.some((b) => b.name === ASSETS_BUCKET)) return;
  const { error } = await supabase.storage.createBucket(ASSETS_BUCKET, {
    public: true,
    fileSizeLimit: 6 * 1024 * 1024,
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
  });
  if (error && !error.message.includes("already exists")) {
    throw new Error(error.message);
  }
}

export async function uploadAsset(objectPath: string, body: Buffer, contentType: string): Promise<string> {
  await ensureAssetsBucket();
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage.from(ASSETS_BUCKET).upload(objectPath, body, {
    upsert: true,
    contentType,
    cacheControl: "86400",
  });
  if (error) throw new Error(error.message);
  return assetPublicUrl(objectPath);
}
