/**
 * Quick sanity checks for Vibe Shift pure engine rules.
 * Run: npx tsx scripts/verify-shift-engine.ts
 */
import { applySlide, createBoard, slideCol, slideRow } from "../lib/vibe-shift/shiftBoard";
import { findLegalMoves, wouldMatch } from "../lib/vibe-shift/shiftLegalMoves";
import { findMatches, hasAnyMatch } from "../lib/vibe-shift/shiftMatch";
import { applyPlayerMove, createDailyBoard, initClassicRun, initDailyRun } from "../lib/vibe-shift/shiftEngine";
import { GRID_ROWS, GRID_COLS } from "../lib/vibe-shift/shiftConfig";
import { gravityAndRefill } from "../lib/vibe-shift/shiftGravity";
import { seededRandom } from "../lib/daily-seed";

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
  const board = [
    [0, 1, 2],
    [3, 4, 5],
  ] as import("../lib/vibe-shift/shiftBoard").Board;
  const shifted = slideRow(board, 0, 1);
  assert("row wrap right", shifted[0]![0] === 2 && shifted[0]![1] === 0 && shifted[0]![2] === 1);
}

{
  const board = [
    [0, 0],
    [0, 0],
    [1, 2],
  ] as import("../lib/vibe-shift/shiftBoard").Board;
  const m = findMatches(board);
  assert("2x2 square detected", m.groups.some((g) => g.kind === "square" && g.size === 2));
  assert("square clears 4 cells", m.cellCount === 4);
}

{
  const board = [
    [0, 0, 0, 0],
    [2, 3, 4, 5],
  ] as import("../lib/vibe-shift/shiftBoard").Board;
  const m = findMatches(board);
  assert("line4 detected", m.groups.some((g) => g.kind === "line4"));
}

{
  const board = [
    [0, 1],
    [null, 2],
    [3, null],
    [4, 5],
  ] as import("../lib/vibe-shift/shiftBoard").Board;
  const rand = seededRandom("gravity-test");
  const { board: after, falls } = gravityAndRefill(board, rand);
  assert("gravity fills column", after[3]![0] === 4 && after[1]![0] === 0 && after[3]![1] === 5);
  assert("gravity spawns new cells", after[0]![1] !== null && after[1]![0] !== null);
  assert("gravity records falls", falls.length >= 2);
}

{
  const a = createDailyBoard("2026-05-22");
  const b = createDailyBoard("2026-05-22");
  assert("daily board deterministic", JSON.stringify(a) === JSON.stringify(b));
}

{
  const rand = seededRandom("verify-no-match");
  const board = createBoard(GRID_ROWS, GRID_COLS, rand);
  assert("generated board has no starting matches", !hasAnyMatch(board));
}

{
  let state = initDailyRun("verify-revert");
  let revertMove = null as import("../lib/vibe-shift/shiftBoard").ShiftMove | null;
  for (let r = 0; r < GRID_ROWS; r++) {
    for (const dir of [1, -1] as const) {
      const m = { axis: "row" as const, index: r, dir };
      if (!wouldMatch(state.board, m)) {
        revertMove = m;
        break;
      }
    }
    if (revertMove) break;
  }
  if (revertMove) {
    const before = JSON.stringify(state.board);
    const next = applyPlayerMove(state, revertMove);
    assert("revert preserves board", JSON.stringify(next.board) === before);
    assert("revert does not consume move", next.movesUsed === state.movesUsed);
  } else {
    console.log("~ skip revert test (all moves match on this seed)");
  }
}

{
  let state = initClassicRun("verify-classic");
  const legal = findLegalMoves(state.board);
  assert("classic board has legal moves", legal.length > 0);
  if (legal[0]) {
    const next = applyPlayerMove(state, legal[0]!);
    assert("successful move increments moves", next.movesUsed === 1);
    assert("successful move adds score", next.score > 0);
  }
}

{
  const d = initDailyRun("2026-05-22");
  assert("daily move budget", d.maxMoves === 35);
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
