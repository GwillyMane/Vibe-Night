# VIBE GARDEN — physics ecosystem puzzler

**Vibe Garden** (`gameId: vibe-garden`) is the third Vibe Night title: tap-to-plant GVC library vibes in a Matter.js garden, chain bloom reactions, and manage corruption.

## Core loop

1. Tap the garden to plant the next vibe.
2. Blooms spread to nearby compatible vibes.
3. Corruption spawns and infects neighbors — cleanse with blooms and stabilizers (Mint/Blue).
4. Classic is endless; Daily is a **90s** seeded run; Zen has no fail state.

## Tuning (`lib/vibe-garden/gardenConfig.ts`)

| Setting | Value |
| --- | --- |
| Canvas | 520 × 560 |
| Max entities | 28 |
| Corruption max | 100 |
| Daily duration | 90s |
| Plant cooldown | ~400ms |

## API

- `POST/GET /api/scores?gameId=vibe-garden&mode=classic|daily&levelId=garden`
- Daily requires `seed` (NY `todaySeed()`).

## Routes

- Hub card → **VIBE GARDEN**
- Direct: `/vibe-garden`

## Assets

Faces from [`lib/assets/gvcLibraryFaces.ts`](../lib/assets/gvcLibraryFaces.ts).

Preview: `public/games/vibe-garden-preview.png` (placeholder OK).
