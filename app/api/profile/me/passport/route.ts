import { NextResponse } from "next/server";
import { dbAvailable, ensureTables, getPool } from "@/lib/db";
import { recordActivity } from "@/lib/profile/activity";
import { fetchProfileMe, savePassportUrl } from "@/lib/profile/queries";
import { resolveAppOrigin } from "@/lib/passport/appUrl";
import { renderPassportImage } from "@/lib/passport/renderPassportImage";
import { rateLimitAllow } from "@/lib/rateLimit";
import { getCurrentUserFromRequest } from "@/lib/session";
import { supabaseConfigured } from "@/lib/supabase/client";
import { uploadPassport } from "@/lib/supabase/storage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!dbAvailable()) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }
  if (!supabaseConfigured()) {
    return NextResponse.json({ error: "Passport storage is not configured." }, { status: 503 });
  }

  try {
    await ensureTables();
  } catch {
    return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  }

  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!rateLimitAllow(`passport:${user.id}`, 1, 30_000)) {
    return NextResponse.json({ error: "Please wait before generating another passport." }, { status: 429 });
  }

  const pool = getPool()!;
  const profile = await fetchProfileMe(pool, user.id);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  try {
    const origin = resolveAppOrigin(request);
    const profilePath = `${origin}/profile/${encodeURIComponent(profile.username)}`;
    const png = await renderPassportImage(profile, { origin, profilePath });
    const passportUrl = await uploadPassport(user.id, png);
    const generatedAt = await savePassportUrl(pool, user.id, passportUrl);

    await recordActivity(pool, user.id, "passport_generated", {
      label: "Vibe Night Passport",
      passportUrl,
    });

    return NextResponse.json({ passportUrl, generatedAt });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Passport generation failed:", e);
    return NextResponse.json(
      { error: process.env.NODE_ENV === "development" ? msg : "Could not generate passport." },
      { status: 500 }
    );
  }
}
