import assert from "node:assert/strict";
import { verifyScoreReplay, scoreRequiresReplay } from "../lib/scoreReplay";
import { validateArcadeMovesMetadata } from "../lib/scoreMetadataValidation";
import { SHIFT_GAME_ID } from "../lib/vibe-shift/shiftConfig";
import { LUCKY_GAME_ID } from "../lib/lucky-vibes/luckyConfig";
import { MERGE_GAME_ID } from "../lib/vibe-merge/mergeConfig";
import { CRASHERS_GAME_ID } from "../lib/games/catalog";
import { rateLimitAllow } from "../lib/rateLimit";
import { sanitizeAchievementSlugs } from "../lib/syncAchievements";

function testScoreReplay() {
  assert.equal(scoreRequiresReplay(SHIFT_GAME_ID), true);
  assert.equal(scoreRequiresReplay(LUCKY_GAME_ID), true);
  assert.equal(scoreRequiresReplay(CRASHERS_GAME_ID), true);

  const crashersNoMoves = verifyScoreReplay({
    gameId: CRASHERS_GAME_ID,
    mode: "level",
    score: 5000,
    movesJson: null,
  });
  assert.equal(crashersNoMoves.ok, false);

  const shiftNoMoves = verifyScoreReplay({
    gameId: SHIFT_GAME_ID,
    mode: "classic",
    score: 100,
    movesJson: null,
  });
  assert.equal(shiftNoMoves.ok, false);

  const mergeMeta = validateArcadeMovesMetadata({
    gameId: MERGE_GAME_ID,
    mode: "classic",
    score: 50_000,
    movesJson: JSON.stringify({ merges: 120, highestTier: 8 }),
  });
  assert.equal(mergeMeta.ok, true);

  const mergeBad = validateArcadeMovesMetadata({
    gameId: MERGE_GAME_ID,
    mode: "classic",
    score: 999_999,
    movesJson: JSON.stringify({ merges: 1, highestTier: 2 }),
  });
  assert.equal(mergeBad.ok, false);
}

function testRateLimit() {
  const key = `test:${Date.now()}`;
  assert.equal(rateLimitAllow(key, 2, 60_000), true);
  assert.equal(rateLimitAllow(key, 2, 60_000), true);
  assert.equal(rateLimitAllow(key, 2, 60_000), false);
}

function testAchievements() {
  const clean = sanitizeAchievementSlugs(["first-win", "bad slug!", "first-win", "a".repeat(100)]);
  assert.deepEqual(clean, ["first-win"]);
}

testScoreReplay();
testRateLimit();
testAchievements();
console.log("All tests passed.");
