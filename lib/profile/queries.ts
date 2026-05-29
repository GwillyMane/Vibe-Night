import type { Pool } from "pg";
import { GAME_LIBRARY } from "@/lib/games/catalog";
import { rewardBadgeUrlForKey } from "@/lib/gvcRewardBadges";
import {
  DEFAULT_TITLE_ID,
  titleById,
  achievementByKey,
  type ArcadeTier,
  type CosmeticType,
} from "./catalog";
import type {
  PublicProfile,
  ProfileMe,
  ProfileStatChip,
  ProfileStreak,
  ActivityItem,
  PinnedBadge,
  GameStatsJson,
  CollectionsSnapshot,
  CollectionItem,
} from "./types";
import { ensureProfileRow, evaluateAndPersistUnlocks, loadUnlockContext } from "./unlocks";
import {
  PROFILE_TITLES,
  PROFILE_THEMES,
  PROFILE_BORDERS,
  PROFILE_GLOWS,
  PROFILE_BACKGROUNDS,
  PROFILE_PARTICLES,
  VIBE_FACES,
  UNIFIED_ACHIEVEMENTS,
  achievementKey,
} from "./catalog";
import { resolveTitleId } from "./titles";
import { titleUnlocked } from "./titleUnlockLogic";
import { inferEarnedAchievementKeys, slugsToSyncByGame, type CrashersProgressHints } from "./earnedAchievements";

function gameLabel(gameId: string | null): string | null {
  if (!gameId) return null;
  return GAME_LIBRARY.find((g) => g.id === gameId)?.shortTitle ?? gameId;
}

function isActiveRecently(lastActiveAt: Date | null): boolean {
  if (!lastActiveAt) return false;
  return Date.now() - lastActiveAt.getTime() < 24 * 60 * 60 * 1000;
}

function buildStats(gameStats: Record<string, GameStatsJson>, streak: ProfileStreak): ProfileStatChip[] {
  let totalScore = 0;
  let maxCombo = 0;
  let levelsCleared = 0;
  let blooms = 0;
  let catches = 0;
  let structures = 0;
  let dailyWins = 0;
  let legendary = 0;

  for (const [gameId, s] of Object.entries(gameStats)) {
    totalScore += (s.bestClassic ?? 0) + (s.bestDaily ?? 0);
    maxCombo = Math.max(maxCombo, s.maxCombo ?? 0);
    levelsCleared += s.levelsCleared ?? 0;
    blooms += s.goldBlooms ?? 0;
    catches += s.totalCatches ?? 0;
    structures += s.structuresDestroyed ?? 0;
    dailyWins += s.dailyWins ?? 0;
    if (gameId === "vibe-merge" && (s.highestTierEver ?? 0) >= 10) legendary++;
    if (gameId === "vibe-garden" && (s.maxBloomChain ?? 0) >= 25) legendary++;
    if (gameId === "catch-a-vibe" && (s.bestClassic ?? 0) >= 8000) legendary++;
  }

  const chips: ProfileStatChip[] = [
    { id: "total-score", label: "Arcade score", value: totalScore.toLocaleString() },
    { id: "streak", label: "Streak", value: `${streak.currentStreak}d` },
    { id: "combo", label: "Best combo", value: String(maxCombo) },
  ];
  if (levelsCleared > 0) chips.push({ id: "levels", label: "Levels cleared", value: String(levelsCleared) });
  if (blooms > 0) chips.push({ id: "blooms", label: "Gold blooms", value: String(blooms) });
  if (catches > 0) chips.push({ id: "catches", label: "Vibes caught", value: String(catches) });
  if (structures > 0) chips.push({ id: "structures", label: "Structures crushed", value: String(structures) });
  if (dailyWins > 0) chips.push({ id: "daily-wins", label: "Daily wins", value: String(dailyWins) });
  if (legendary > 0) chips.push({ id: "legendary", label: "Legendary moments", value: String(legendary) });
  return chips.slice(0, 8);
}

async function fetchProfileRows(pool: Pool, username: string) {
  const { rows } = await pool.query<{
    id: string;
    username: string;
    created_at: Date;
    equipped_title_id: string;
    featured_badge_key: string | null;
    avatar_face_id: string;
    favorite_game_id: string | null;
    theme_id: string;
    border_id: string;
    glow_id: string;
    background_id: string;
    particle_id: string;
    vibe_rank: number;
    arcade_tier: string;
    last_active_at: Date | null;
    passport_url: string | null;
    passport_generated_at: Date | null;
  }>(
    `SELECT u.id, u.username, u.created_at,
            COALESCE(p.equipped_title_id, $2) AS equipped_title_id,
            p.featured_badge_key, COALESCE(p.avatar_face_id, 'shaka') AS avatar_face_id,
            p.favorite_game_id, COALESCE(p.theme_id, 'midnight') AS theme_id,
            COALESCE(p.border_id, 'gold-ring') AS border_id,
            COALESCE(p.glow_id, 'gold') AS glow_id,
            COALESCE(p.background_id, 'embers') AS background_id,
            COALESCE(p.particle_id, 'gold-drift') AS particle_id,
            COALESCE(p.vibe_rank, 0) AS vibe_rank,
            COALESCE(p.arcade_tier, 'Rookie') AS arcade_tier,
            p.last_active_at,
            p.passport_url,
            p.passport_generated_at
     FROM users u
     LEFT JOIN user_profiles p ON p.user_id = u.id
     WHERE lower(u.username) = lower($1)
     LIMIT 1`,
    [username.trim(), DEFAULT_TITLE_ID]
  );
  return rows[0] ?? null;
}

async function fetchPinnedBadges(pool: Pool, userId: string): Promise<PinnedBadge[]> {
  const { rows } = await pool.query<{ slot: number; badge_key: string }>(
    `SELECT slot, badge_key FROM user_pinned_badges WHERE user_id = $1::uuid ORDER BY slot`,
    [userId]
  );
  return rows.map((r) => ({ slot: r.slot, badgeKey: r.badge_key }));
}

async function fetchRecentActivity(pool: Pool, userId: string, limit = 8): Promise<ActivityItem[]> {
  const { rows } = await pool.query<{ id: string; kind: string; payload: Record<string, unknown>; created_at: Date }>(
    `SELECT id::text, kind, payload, created_at FROM user_activity
     WHERE user_id = $1::uuid ORDER BY created_at DESC LIMIT $2`,
    [userId, limit]
  );
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    payload: r.payload ?? {},
    createdAt: new Date(r.created_at).toISOString(),
  }));
}

async function fetchAchievementCount(pool: Pool, userId: string): Promise<number> {
  const { rows } = await pool.query<{ c: string }>(
    `SELECT COUNT(*)::text AS c FROM user_achievements WHERE user_id = $1::uuid`,
    [userId]
  );
  return Number(rows[0]?.c ?? 0);
}

export async function fetchPublicProfile(
  pool: Pool,
  username: string,
  viewerUserId?: string | null
): Promise<PublicProfile | null> {
  const row = await fetchProfileRows(pool, username);
  if (!row) return null;

  const ctx = await loadUnlockContext(pool, row.id);
  const title = titleById(row.equipped_title_id) ?? titleById(DEFAULT_TITLE_ID)!;
  const pinnedBadges = await fetchPinnedBadges(pool, row.id);
  const recentActivity = await fetchRecentActivity(pool, row.id);
  const achievementCount = await fetchAchievementCount(pool, row.id);

  let featuredBadgeKey = row.featured_badge_key;
  if (!featuredBadgeKey && pinnedBadges.length > 0) {
    featuredBadgeKey = pinnedBadges[0]!.badgeKey;
  }

  return {
    username: row.username,
    joinDate: new Date(row.created_at).toISOString(),
    lastActiveAt: row.last_active_at ? new Date(row.last_active_at).toISOString() : null,
    isActiveRecently: isActiveRecently(row.last_active_at),
    avatarFaceId: row.avatar_face_id,
    equippedTitleId: row.equipped_title_id,
    equippedTitleLabel: title.label,
    titleRarity: title.rarity,
    featuredBadgeKey,
    favoriteGameId: row.favorite_game_id,
    favoriteGameLabel: gameLabel(row.favorite_game_id),
    themeId: row.theme_id,
    borderId: row.border_id,
    glowId: row.glow_id,
    backgroundId: row.background_id,
    particleId: row.particle_id,
    vibeRank: row.vibe_rank,
    arcadeTier: row.arcade_tier as ArcadeTier,
    streak: ctx.streak,
    stats: buildStats(ctx.gameStats, ctx.streak),
    pinnedBadges,
    recentActivity,
    achievementCount,
    isOwner: Boolean(viewerUserId && viewerUserId === row.id),
    passportUrl: row.passport_url ?? null,
    passportGeneratedAt: row.passport_generated_at
      ? new Date(row.passport_generated_at).toISOString()
      : null,
  };
}

export async function fetchProfileMe(pool: Pool, userId: string): Promise<ProfileMe | null> {
  await ensureProfileRow(pool, userId);
  const { rows } = await pool.query<{ username: string }>(`SELECT username FROM users WHERE id = $1::uuid`, [userId]);
  if (!rows[0]) return null;

  const publicProfile = await fetchPublicProfile(pool, rows[0].username, userId);
  if (!publicProfile) return null;

  const [titleRows, cosmeticRows, achRows] = await Promise.all([
    pool.query<{ title_id: string }>(`SELECT title_id FROM user_titles WHERE user_id = $1::uuid`, [userId]),
    pool.query<{ cosmetic_type: string; cosmetic_id: string }>(
      `SELECT cosmetic_type, cosmetic_id FROM user_unlocked_cosmetics WHERE user_id = $1::uuid`,
      [userId]
    ),
    pool.query<{ game_id: string; achievement_id: string }>(
      `SELECT game_id, achievement_id FROM user_achievements WHERE user_id = $1::uuid`,
      [userId]
    ),
  ]);

  return {
    ...publicProfile,
    userId,
    ownedTitleIds: titleRows.rows.map((r) => r.title_id),
    ownedCosmetics: cosmeticRows.rows.map((r) => ({
      type: r.cosmetic_type as CosmeticType,
      id: r.cosmetic_id,
    })),
    unlockedAchievementKeys: achRows.rows.map((r) => achievementKey(r.game_id as "vibe-crashers", r.achievement_id)),
  };
}

export async function fetchCrashersProgressHints(pool: Pool, userId: string): Promise<CrashersProgressHints> {
  const [lv, daily] = await Promise.all([
    pool.query<{ completed: boolean; best_stars: number }>(
      `SELECT completed, best_stars FROM user_level_progress WHERE user_id = $1::uuid`,
      [userId]
    ),
    pool.query<{ completed: boolean }>(
      `SELECT completed FROM user_daily_progress WHERE user_id = $1::uuid AND completed = TRUE LIMIT 1`,
      [userId]
    ),
  ]);
  let levelsCleared = 0;
  let maxStars = 0;
  for (const row of lv.rows) {
    if (row.completed || row.best_stars >= 1) levelsCleared += 1;
    maxStars = Math.max(maxStars, row.best_stars ?? 0);
  }
  return {
    levelsCleared,
    maxStars,
    dailyCompleted: daily.rows.length > 0,
  };
}

/** Merge DB achievements with stats-inferred earns and backfill missing rows. */
export async function reconcileProfileAchievements(pool: Pool, userId: string): Promise<string[]> {
  const ctx = await loadUnlockContext(pool, userId);
  const hints = await fetchCrashersProgressHints(pool, userId);
  const inferred = inferEarnedAchievementKeys(ctx.achievementKeys, ctx.gameStats, hints);
  const byGame = slugsToSyncByGame(inferred);
  const newly: string[] = [];
  for (const [gameId, slugs] of Object.entries(byGame) as [import("@/lib/games/catalog").GameId, string[]][]) {
    if (!slugs.length) continue;
    const added = await syncAchievementsForGame(pool, userId, gameId, slugs);
    newly.push(...added);
  }
  return newly;
}

export async function buildCollectionsSnapshot(pool: Pool, userId: string, profile: ProfileMe): Promise<CollectionsSnapshot> {
  await evaluateAndPersistUnlocks(pool, userId);
  await reconcileProfileAchievements(pool, userId);
  const me = (await fetchProfileMe(pool, userId)) ?? profile;

  const ctx = await loadUnlockContext(pool, userId);
  const hints = await fetchCrashersProgressHints(pool, userId);
  const unlockedAch = inferEarnedAchievementKeys(me.unlockedAchievementKeys, ctx.gameStats, hints);
  const ownedTitles = new Set(me.ownedTitleIds);
  const ownedCos = new Set(me.ownedCosmetics.map((c) => `${c.type}:${c.id}`));

  const titles: CollectionItem[] = PROFILE_TITLES.map((t) => ({
    id: t.id,
    label: t.label,
    rarity: t.rarity,
    gameId: t.gameId,
    category: t.category,
    unlocked: ownedTitles.has(t.id) || titleUnlocked(t, ctx),
    equipped: me.equippedTitleId === t.id || resolveTitleId(me.equippedTitleId) === t.id,
  }));

  const badges: CollectionItem[] = UNIFIED_ACHIEVEMENTS.map((a) => ({
    id: a.key,
    label: a.title,
    description: a.description,
    tier: a.tier,
    gameId: a.gameId,
    unlocked: unlockedAch.has(a.key),
    equipped: me.featuredBadgeKey === a.key,
    imageUrl: rewardBadgeUrlForKey(a.key),
  }));

  const mapCosmetics = (items: typeof PROFILE_THEMES, type: string, equippedId: string) =>
    items.map((c) => ({
      id: c.id,
      label: c.label,
      type: c.type,
      unlocked: ownedCos.has(`${type}:${c.id}`),
      equipped: equippedId === c.id,
    }));

  return {
    titles,
    badges,
    faces: mapCosmetics(VIBE_FACES, "face", me.avatarFaceId),
    themes: mapCosmetics(PROFILE_THEMES, "theme", me.themeId),
    borders: mapCosmetics(PROFILE_BORDERS, "border", me.borderId),
    glows: mapCosmetics(PROFILE_GLOWS, "glow", me.glowId),
    backgrounds: mapCosmetics(PROFILE_BACKGROUNDS, "background", me.backgroundId),
    particles: mapCosmetics(PROFILE_PARTICLES, "particle", me.particleId),
  };
}

export async function savePassportUrl(pool: Pool, userId: string, passportUrl: string): Promise<string> {
  const { rows } = await pool.query<{ passport_generated_at: Date }>(
    `UPDATE user_profiles
     SET passport_url = $2, passport_generated_at = NOW(), updated_at = NOW()
     WHERE user_id = $1::uuid
     RETURNING passport_generated_at`,
    [userId, passportUrl]
  );
  return new Date(rows[0]?.passport_generated_at ?? Date.now()).toISOString();
}

export async function upsertGameStats(
  pool: Pool,
  userId: string,
  gameId: string,
  patch: GameStatsJson
): Promise<void> {
  const { rows } = await pool.query<{ stats_json: GameStatsJson }>(
    `SELECT stats_json FROM user_game_stats WHERE user_id = $1::uuid AND game_id = $2`,
    [userId, gameId]
  );
  const prev = rows[0]?.stats_json ?? {};
  const merged: GameStatsJson = { ...prev };
  for (const [k, v] of Object.entries(patch)) {
    if (typeof v === "number") {
      const key = k as keyof GameStatsJson;
      merged[key] = Math.max(Number(merged[key] ?? 0), v) as never;
    } else if (v !== undefined) {
      (merged as Record<string, unknown>)[k] = v;
    }
  }
  await pool.query(
    `INSERT INTO user_game_stats (user_id, game_id, stats_json, updated_at)
     VALUES ($1::uuid, $2, $3::jsonb, NOW())
     ON CONFLICT (user_id, game_id) DO UPDATE SET stats_json = EXCLUDED.stats_json, updated_at = NOW()`,
    [userId, gameId, JSON.stringify(merged)]
  );
}

export async function syncAchievementsForGame(
  pool: Pool,
  userId: string,
  gameId: string,
  slugs: string[]
): Promise<string[]> {
  const newly: string[] = [];
  for (const slug of slugs) {
    if (!/^[a-z0-9-]+$/i.test(slug) || slug.length > 64) continue;
    const res = await pool.query(
      `INSERT INTO user_achievements (user_id, game_id, achievement_id)
       VALUES ($1::uuid, $2, $3) ON CONFLICT DO NOTHING RETURNING achievement_id`,
      [userId, gameId, slug]
    );
    if (res.rowCount) {
      newly.push(achievementKey(gameId as "vibe-crashers", slug));
    }
  }
  return newly;
}
