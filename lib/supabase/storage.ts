import { getSupabaseAdmin } from "./client";

const BUCKET = "passports";

export function passportStoragePath(userId: string): string {
  return `${userId}/passport.png`;
}

export function passportPublicUrl(userId: string, cacheBust?: number): string {
  const url = process.env.SUPABASE_URL;
  if (!url) throw new Error("SUPABASE_URL is not configured.");
  const base = `${url}/storage/v1/object/public/${BUCKET}/${passportStoragePath(userId)}`;
  return cacheBust ? `${base}?v=${cacheBust}` : base;
}

export async function uploadPassport(userId: string, png: Buffer): Promise<string> {
  const supabase = getSupabaseAdmin();
  const path = passportStoragePath(userId);
  const { error } = await supabase.storage.from(BUCKET).upload(path, png, {
    upsert: true,
    contentType: "image/png",
    cacheControl: "3600",
  });
  if (error) throw new Error(error.message);
  return passportPublicUrl(userId, Date.now());
}
