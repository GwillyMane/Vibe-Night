import { NextResponse } from "next/server";
import { dbAvailable, ensureTables, getPool } from "@/lib/db";
import { recordActivity, touchLastActive } from "@/lib/profile/activity";
import { bumpStreak } from "@/lib/profile/streaks";
import { evaluateAndPersistUnlocks, ensureProfileRow } from "@/lib/profile/unlocks";
import { titleById } from "@/lib/profile/catalog";
import { getCurrentUserFromRequest } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
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

  const pool = getPool()!;
  await ensureProfileRow(pool, user.id);
  const result = await bumpStreak(pool, user.id);
  await touchLastActive(pool, user.id);

  if (result.milestoneDays) {
    await recordActivity(pool, user.id, "streak_milestone", {
      label: `${result.milestoneDays}-Day Vibe Night streak`,
      days: result.milestoneDays,
    });
  }

  const unlocks = await evaluateAndPersistUnlocks(pool, user.id);
  for (const titleId of unlocks.newTitles) {
    const t = titleById(titleId);
    await recordActivity(pool, user.id, "title_unlock", {
      label: t?.label ?? titleId,
      titleId,
    });
  }

  return NextResponse.json({
    currentStreak: result.currentStreak,
    longestStreak: result.longestStreak,
    lastPlayDate: result.lastPlayDate,
    bumped: result.bumped,
  });
}
