import { NextResponse } from "next/server";
import { dbAvailable, ensureTables, getPool } from "@/lib/db";
import { titleById, cosmeticById, achievementByKey, type CosmeticType } from "@/lib/profile/catalog";
import { fetchProfileMe } from "@/lib/profile/queries";
import { ensureProfileRow } from "@/lib/profile/unlocks";
import { getCurrentUserFromRequest } from "@/lib/session";

export const runtime = "nodejs";

const COSMETIC_FIELDS: Array<{ field: string; type: CosmeticType }> = [
  { field: "avatarFaceId", type: "face" },
  { field: "themeId", type: "theme" },
  { field: "borderId", type: "border" },
  { field: "glowId", type: "glow" },
  { field: "backgroundId", type: "background" },
  { field: "particleId", type: "particle" },
];

export async function GET(request: Request) {
  if (!dbAvailable()) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
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

  const profile = await fetchProfileMe(getPool()!, user.id);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  return NextResponse.json({ profile });
}

export async function PATCH(request: Request) {
  if (!dbAvailable()) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
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

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const pool = getPool()!;
  await ensureProfileRow(pool, user.id);

  const updates: string[] = [];
  const params: unknown[] = [user.id];
  let p = 2;

  if (typeof body.equippedTitleId === "string") {
    const owned = await pool.query(
      `SELECT 1 FROM user_titles WHERE user_id = $1::uuid AND title_id = $2`,
      [user.id, body.equippedTitleId]
    );
    if (!owned.rowCount || !titleById(body.equippedTitleId)) {
      return NextResponse.json({ error: "Title not owned." }, { status: 400 });
    }
    updates.push(`equipped_title_id = $${p}`);
    params.push(body.equippedTitleId);
    p++;
  }

  if (typeof body.featuredBadgeKey === "string" || body.featuredBadgeKey === null) {
    if (body.featuredBadgeKey !== null) {
      const ach = achievementByKey(body.featuredBadgeKey);
      if (!ach) return NextResponse.json({ error: "Invalid badge." }, { status: 400 });
      const owned = await pool.query(
        `SELECT 1 FROM user_achievements WHERE user_id = $1::uuid AND game_id = $2 AND achievement_id = $3`,
        [user.id, ach.gameId, ach.slug]
      );
      if (!owned.rowCount) {
        return NextResponse.json({ error: "Badge not unlocked." }, { status: 400 });
      }
    }
    updates.push(`featured_badge_key = $${p}`);
    params.push(body.featuredBadgeKey);
    p++;
  }

  if (typeof body.favoriteGameId === "string" || body.favoriteGameId === null) {
    const allowed = ["vibe-crashers", "vibe-merge", "vibe-garden", "catch-a-vibe", "vibe-shift", "lucky-vibes", null];
    if (body.favoriteGameId !== null && !allowed.includes(body.favoriteGameId)) {
      return NextResponse.json({ error: "Invalid game." }, { status: 400 });
    }
    updates.push(`favorite_game_id = $${p}`);
    params.push(body.favoriteGameId);
    p++;
  }

  const fieldMap: Record<string, string> = {
    avatarFaceId: "avatar_face_id",
    themeId: "theme_id",
    borderId: "border_id",
    glowId: "glow_id",
    backgroundId: "background_id",
    particleId: "particle_id",
  };

  for (const { field, type } of COSMETIC_FIELDS) {
    const val = body[field];
    if (typeof val !== "string") continue;
    if (!cosmeticById(type, val)) {
      return NextResponse.json({ error: `Invalid ${field}.` }, { status: 400 });
    }
    const owned = await pool.query(
      `SELECT 1 FROM user_unlocked_cosmetics WHERE user_id = $1::uuid AND cosmetic_type = $2 AND cosmetic_id = $3`,
      [user.id, type, val]
    );
    if (!owned.rowCount) {
      return NextResponse.json({ error: `${field} not owned.` }, { status: 400 });
    }
    updates.push(`${fieldMap[field]} = $${p}`);
    params.push(val);
    p++;
  }

  if (Array.isArray(body.pinnedBadges)) {
    await pool.query(`DELETE FROM user_pinned_badges WHERE user_id = $1::uuid`, [user.id]);
    const pins = body.pinnedBadges as Array<{ slot?: number; badgeKey?: string }>;
    for (const pin of pins.slice(0, 5)) {
      const slot = Number(pin.slot);
      const badgeKey = pin.badgeKey;
      if (!Number.isFinite(slot) || slot < 0 || slot > 4 || typeof badgeKey !== "string") continue;
      const ach = achievementByKey(badgeKey);
      if (!ach) continue;
      const owned = await pool.query(
        `SELECT 1 FROM user_achievements WHERE user_id = $1::uuid AND game_id = $2 AND achievement_id = $3`,
        [user.id, ach.gameId, ach.slug]
      );
      if (!owned.rowCount) continue;
      await pool.query(
        `INSERT INTO user_pinned_badges (user_id, slot, badge_key) VALUES ($1::uuid, $2, $3)
         ON CONFLICT (user_id, slot) DO UPDATE SET badge_key = EXCLUDED.badge_key, pinned_at = NOW()`,
        [user.id, slot, badgeKey]
      );
    }
  }

  if (updates.length > 0) {
    updates.push("updated_at = NOW()");
    await pool.query(
      `UPDATE user_profiles SET ${updates.join(", ")} WHERE user_id = $1::uuid`,
      params
    );
  }

  const profile = await fetchProfileMe(pool, user.id);
  return NextResponse.json({ profile });
}
