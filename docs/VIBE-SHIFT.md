# Vibe Shift

Slide-match puzzle: shift entire rows or columns on a 6×6 grid of GVC face colors.

## Modes

- **Classic** — 10 levels per run with cumulative score targets (600 → 15,500). New board each level. Win by clearing all 10; lose on gridlock.
- **Daily** — Shared seed via `todaySeed()`, 35-move budget, score chase with unused-move efficiency bonus.

## Core rules

- Shifts wrap around row/column edges.
- **Match-or-revert:** a shift only commits if it creates at least one match of 3+; otherwise the board reverts and the move is not consumed.
- Matches clear, refill from seeded stream, cascades repeat until stable.

## Engine (`lib/vibe-shift/`)

| Module | Role |
|--------|------|
| `shiftBoard.ts` | Grid, slide/wrap, move types |
| `shiftMatch.ts` | H/V match detection, clear |
| `shiftRefill.ts` | Seeded refill + cascade loop |
| `shiftLegalMoves.ts` | Simulate shifts for legal move detection |
| `shiftLevels.ts` | Classic targets + level boards |
| `shiftEngine.ts` | Run state, apply move, level-up, replay |
| `shiftScoring.ts` | Points, cascade mult, daily bonus |

Verify: `npx tsx scripts/verify-shift-engine.ts`

## UI

- Route: `/vibe-shift`
- Hub: Vibe Night library → **VIBE SHIFT**
- Canvas drag: horizontal on row, vertical on column

## Integration

- Game ID: `vibe-shift`
- Leaderboard level: `shift`
- Storage prefix: `vibe-shift:persisted`
- Account sync key: `vibeShift`
