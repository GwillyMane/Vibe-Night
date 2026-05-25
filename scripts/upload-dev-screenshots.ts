/**
 * Upload /public/Screenshot*.png to Supabase vibe-night-assets bucket.
 * Run: npm run upload:screenshots
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync, unlinkSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";

async function main() {
  config({ path: resolve(process.cwd(), ".env.local") });

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  const BUCKET = "vibe-night-assets";
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const publicDir = resolve(process.cwd(), "public");
  const files = readdirSync(publicDir).filter((f) => f.startsWith("Screenshot (") && f.endsWith(".png"));

  if (!files.length) {
    console.log("No dev screenshots in /public — already uploaded or none present.");
    return;
  }

  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.some((b) => b.name === BUCKET)) {
    const { error } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 6 * 1024 * 1024,
      allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
    });
    if (error && !error.message.includes("already exists")) {
      console.error("Bucket create failed:", error.message);
      process.exit(1);
    }
    console.log(`Created bucket ${BUCKET}`);
  }

  for (const filename of files) {
    const buf = readFileSync(join(publicDir, filename));
    const objectPath = `dev-screenshots/${filename}`;
    const { error } = await supabase.storage.from(BUCKET).upload(objectPath, buf, {
      upsert: true,
      contentType: "image/png",
      cacheControl: "86400",
    });
    if (error) {
      console.error(`Upload failed for ${filename}:`, error.message);
      process.exit(1);
    }
    const publicUrl = `${url}/storage/v1/object/public/${BUCKET}/${objectPath}`;
    console.log(`Uploaded ${filename} -> ${publicUrl}`);
    const localPath = join(publicDir, filename);
    if (existsSync(localPath)) {
      unlinkSync(localPath);
      console.log(`Removed local ${filename}`);
    }
  }

  console.log(`Done — ${files.length} screenshot(s) on Supabase.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
