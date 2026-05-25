# Lucky Vibes

Modern 6×5 ways slot with premium GVC token symbols and two bonus features.

## Modes

- **Classic** — 30 spins per run, chase high score
- **Daily** — 25 spins on `todaySeed()` + efficiency bonus on unused spins
- **Zen** — unlimited spins, no leaderboard submit

## Core rules

- **1,024 ways** — match symbols left-to-right on adjacent reels; wild substitutes (not One of One / Craig)
- **Premium tokens** — Holo Leader #430, Super Vibe #1151, Champion of Vibes #1400
- **Lucky Spins** — 3+ One of One badges trigger free spins with rising multiplier (cap ×20)
- **Vibe Lock** — 4+ Craig symbols trigger hold-and-respin; empty cells roll Craig or blank; fill the grid for GRAND VIBE (higher orb values)
- **Conflict** — Vibe Lock wins if both would trigger on the same spin

## Engine (`lib/lucky-vibes/`)

| Module | Role |
|--------|------|
| `luckyConfig.ts` | IDs, paytable, weights, constants |
| `luckyRng.ts` | Seeded symbol draw |
| `luckyGrid.ts` | 6×5 grid types |
| `luckyWays.ts` | Ways evaluation |
| `luckyScoring.ts` | Streak mult, daily bonus |
| `luckySpinsFeature.ts` | Lucky Spins feature |
| `luckyLockFeature.ts` | Vibe Lock feature |
| `luckyEngine.ts` | Run state, `applySpin`, replay |
| `luckyStorage.ts` | Persistence |
| `luckyAchievements.ts` | 10 badge defs |
| `luckyScoreValidation.ts` | Server POST bounds |
| `luckyAssets.ts` | Face + token preload |
| `luckyPaint.ts` | Canvas draw |
| `luckyJuice.ts` | Win particles |
| `luckySounds.ts` | Web Audio SFX |

Verify: `npx tsx scripts/verify-lucky-engine.ts`

## UI

- Route: `/lucky-vibes`
- Hub: Vibe Night library → **LUCKY VIBES**
- Canvas reels + bottom SPIN button

## Integration

- Game ID: `lucky-vibes`
- Leaderboard level: `lucky`
- Storage prefix: `lucky-vibes:persisted`
- Account sync key: `luckyVibes`
