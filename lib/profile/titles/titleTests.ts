import assert from "node:assert/strict";
import { buildGameTitles } from "./buildGameTitles";
import { LEGACY_TITLE_MIGRATIONS, PROFILE_TITLES } from "./index";
import { titleUnlocked, countGamesPlayed, countGamesWithZen, ALL_GAME_IDS } from "../titleUnlockLogic";
import type { UnlockContext } from "../types";
import { achievementKey } from "../catalog";

function emptyCtx(overrides: Partial<UnlockContext> = {}): UnlockContext {
  return {
    achievementKeys: new Set(),
    ownedTitleIds: new Set(),
    ownedCosmetics: new Set(),
    streak: { currentStreak: 0, longestStreak: 0, lastPlayDate: null },
    vibeRank: 0,
    arcadeTier: "Rookie",
    gameStats: {},
    gamesWithScores: new Set(),
    hasPassport: false,
    ...overrides,
  };
}

function testBuildGameTitles() {
  const gameTitles = buildGameTitles();
  assert.equal(gameTitles.length, 60);
  const ids = new Set(gameTitles.map((t) => t.id));
  assert.equal(ids.size, 60);
  for (const t of gameTitles) {
    assert.equal(t.category, "game");
    assert.equal(t.unlockRule, "achievement");
    assert.ok(t.gameId);
    assert.ok(t.unlockParams?.slug);
  }
}

function testProfileTitlesCount() {
  assert.equal(PROFILE_TITLES.length, 71);
  const ids = new Set(PROFILE_TITLES.map((t) => t.id));
  assert.equal(ids.size, 71);
}

function testLegacyMigrations() {
  const oldIds = [
    "bloom-keeper",
    "chaos-catcher",
    "golden-stacker",
    "garden-guardian",
    "crash-architect",
  ];
  for (const oldId of oldIds) {
    const newId = LEGACY_TITLE_MIGRATIONS[oldId];
    assert.ok(newId, `missing migration for ${oldId}`);
    assert.notEqual(oldId, newId);
    assert.ok(PROFILE_TITLES.some((t) => t.id === newId), `new id ${newId} not in catalog`);
  }
}

function testTitleUnlockRules() {
  const achievementTitle = PROFILE_TITLES.find((t) => t.id === "shift-first-shift")!;
  assert.ok(achievementTitle);
  const ctxAch = emptyCtx({
    achievementKeys: new Set([achievementKey("vibe-shift", "first-shift")]),
  });
  assert.equal(titleUnlocked(achievementTitle, ctxAch), true);

  const sixGame = PROFILE_TITLES.find((t) => t.id === "six-game-regular")!;
  const stats: UnlockContext["gameStats"] = {};
  for (const id of ALL_GAME_IDS) {
    stats[id] = { runs: 1 };
  }
  assert.equal(titleUnlocked(sixGame, emptyCtx({ gameStats: stats })), true);
  assert.equal(countGamesPlayed(stats), 6);

  const zenTourist = PROFILE_TITLES.find((t) => t.id === "zen-tourist")!;
  const zenStats: UnlockContext["gameStats"] = {};
  for (const id of ALL_GAME_IDS) {
    zenStats[id] = { zenParticipation: 1 };
  }
  assert.equal(titleUnlocked(zenTourist, emptyCtx({ gameStats: zenStats })), true);
  assert.equal(countGamesWithZen(zenStats), 6);

  const passportTitle = PROFILE_TITLES.find((t) => t.id === "passport-certified")!;
  assert.equal(titleUnlocked(passportTitle, emptyCtx({ hasPassport: true })), true);
  assert.equal(titleUnlocked(passportTitle, emptyCtx()), false);

  const badgeCollector = PROFILE_TITLES.find((t) => t.id === "badge-collector")!;
  const keys = new Set(Array.from({ length: 30 }, (_, i) => `vibe-crashers:slug-${i}`));
  assert.equal(titleUnlocked(badgeCollector, emptyCtx({ achievementKeys: keys })), true);
}

export function runTitleTests() {
  testBuildGameTitles();
  testProfileTitlesCount();
  testLegacyMigrations();
  testTitleUnlockRules();
}
