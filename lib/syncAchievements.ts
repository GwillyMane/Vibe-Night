import type { Pool, PoolClient } from "pg";
import { syncAchievementsForGame } from "@/lib/profile/queries";
import type { GameId } from "@/lib/games/catalog";

const SLUG_RE = /^[a-z0-9_-]+$/i;
const MAX_SLUGS = 200;

export function sanitizeAchievementSlugs(slugs: unknown): string[] {
  if (!Array.isArray(slugs)) return [];
  const out: string[] = [];
  for (const s of slugs) {
    if (typeof s !== "string") continue;
    const t = s.trim();
    if (!SLUG_RE.test(t) || t.length > 64) continue;
    if (out.includes(t)) continue;
    out.push(t);
    if (out.length >= MAX_SLUGS) break;
  }
  return out;
}

export async function persistClientAchievements(
  db: Pool | PoolClient,
  userId: string,
  gameId: GameId,
  slugs: string[]
): Promise<string[]> {
  const clean = sanitizeAchievementSlugs(slugs);
  if (!clean.length) return [];
  return syncAchievementsForGame(db as Pool, userId, gameId, clean);
}
