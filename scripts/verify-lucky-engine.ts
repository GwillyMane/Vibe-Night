/**
 * Quick sanity checks for Lucky Vibes pure engine rules.
 * Run: npx tsx scripts/verify-lucky-engine.ts
 */
import { seededRandom } from "../lib/daily-seed";
import {
  applySpin,
  initClassicRun,
  initDailyRun,
  replayScore,
  finalRunScore,
} from "../lib/lucky-vibes/luckyEngine";
import { generateGrid, countScatters, createEmptyGrid } from "../lib/lucky-vibes/luckyGrid";
import { evaluateWays, totalWayPoints } from "../lib/lucky-vibes/luckyWays";
import { luckySpinsAward, runLuckySpinsFeature } from "../lib/lucky-vibes/luckySpinsFeature";
import {
  runVibeLockFeature,
  shouldTriggerVibeLock,
  gridWithOrbs,
} from "../lib/lucky-vibes/luckyLockFeature";
import { MAX_LUCKY_MULTIPLIER, MAX_SCORE, REELS, ROWS } from "../lib/lucky-vibes/luckyConfig";
import type { Grid } from "../lib/lucky-vibes/luckyGrid";

let passed = 0;
let failed = 0;

function assert(name: string, cond: boolean) {
  if (cond) {
    passed++;
    console.log(`✓ ${name}`);
  } else {
    failed++;
    console.error(`✗ ${name}`);
  }
}

{
  const a = generateGrid("2026-05-24", 0, "daily", "base");
  const b = generateGrid("2026-05-24", 0, "daily", "base");
  assert("daily grid deterministic", JSON.stringify(a) === JSON.stringify(b));
}

{
  const a = generateGrid("2026-05-24", 0, "daily", "base");
  const b = generateGrid("2026-05-24", 1, "daily", "base");
  assert("different spin index differs", JSON.stringify(a) !== JSON.stringify(b));
}

{
  const grid: Grid = createEmptyGrid();
  for (let r = 0; r < 3; r++) {
    for (let y = 0; y < ROWS; y++) grid[r]![y] = "face:0";
  }
  for (let r = 3; r < REELS; r++) {
    for (let y = 0; y < ROWS; y++) grid[r]![y] = "face:1";
  }
  const wins = evaluateWays(grid);
  assert("3-reel face ways detected", wins.some((w) => w.symbol === "face:0" && w.reelCount === 3));
  assert("ways multiply rows", wins.find((w) => w.symbol === "face:0")!.ways === ROWS ** 3);
}

{
  const grid: Grid = createEmptyGrid();
  for (let r = 0; r < REELS; r++) {
    for (let y = 0; y < ROWS; y++) grid[r]![y] = r < 3 ? "face:3" : "face:1";
  }
  for (let r = 0; r < REELS; r++) grid[r]![0] = "wild";
  const wins = evaluateWays(grid);
  assert("wild substitutes for face", wins.some((w) => w.symbol === "face:3"));
}

{
  const grid: Grid = createEmptyGrid();
  for (let r = 0; r < REELS; r++) {
    for (let y = 0; y < ROWS; y++) grid[r]![y] = "scatter";
  }
  for (let r = 0; r < REELS; r++) grid[r]![2] = "wild";
  const wins = evaluateWays(grid);
  assert("6 wild line", wins.some((w) => w.symbol === "wild" && w.reelCount === 6));
}

{
  assert("lucky spins award 3 scatters", luckySpinsAward(3) === 10);
  assert("lucky spins award 6 scatters", luckySpinsAward(6) === 20);
}

{
  const ls = runLuckySpinsFeature("test-lucky-spins", "classic", 3);
  assert("lucky spins produces steps", ls.steps.length >= 10);
  assert("lucky spins total >= 0", ls.totalWin >= 0);
  assert("lucky spins mult cap", ls.maxMultiplier <= MAX_LUCKY_MULTIPLIER);
}

{
  const grid = gridWithOrbs(4);
  assert("vibe lock trigger at 4 orbs", shouldTriggerVibeLock(grid));
  const lock = runVibeLockFeature("test-vibe-lock", "classic", grid, 0);
  assert("vibe lock total >= 4 orb mins", lock.total >= 100);
}

{
  const grid = gridWithOrbs(6);
  grid[5]![4] = "scatter";
  grid[5]![3] = "scatter";
  grid[5]![2] = "scatter";
  assert("vibe lock priority over scatters", shouldTriggerVibeLock(grid) && countScatters(grid) >= 3);
}

{
  const a = initDailyRun();
  const b = initDailyRun();
  const ga = generateGrid(a.seed, 0, "daily", "base");
  const gb = generateGrid(b.seed, 0, "daily", "base");
  assert("daily runs get unique random seeds", a.seed !== b.seed && JSON.stringify(ga) !== JSON.stringify(gb));
}

{
  let state = initDailyRun();
  const moves: { at: number; kind: string; payload: Record<string, unknown> }[] = [];
  for (let i = 0; i < 25 && state.phase === "playing"; i++) {
    const before = state.moves.length;
    const r = applySpin(state);
    state = r.state;
    if (state.moves.length > before) moves.push(...state.moves.slice(before));
  }
  assert("daily run ends after budget", state.phase === "ended" || state.spinsLeft === 0);
  assert("daily score bounded", finalRunScore(state) <= MAX_SCORE);
}

{
  let state = initClassicRun("verify-replay");
  for (let i = 0; i < 5 && state.phase === "playing"; i++) {
    state = applySpin(state).state;
  }
  const json = JSON.stringify(state.moves);
  const replayed = replayScore("verify-replay", "classic", json);
  assert("replay score matches", replayed === finalRunScore(state));
}

{
  let state = initClassicRun("verify-classic-budget");
  let spins = 0;
  while (state.phase === "playing" && spins < 50) {
    state = applySpin(state).state;
    spins++;
  }
  assert("classic ends at 30 spins", state.spinsUsed === 30);
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
