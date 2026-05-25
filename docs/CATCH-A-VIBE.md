# CATCH A VIBE — swipe catch arcade

**Catch A Vibe** (`gameId: catch-a-vibe`) is the fourth Vibe Night title: swipe through launching GVC vibes, chain combos, and dodge Bad Vibes Guy.

## Core loop

1. Vibes launch upward into the arena on parabolic arcs.
2. Swipe through **good** vibes to catch — vibes dissolve inward with bloom particles.
3. **Bad Vibes Guy** (GVC #4113) appears rarely at first, more often over time — **do not catch him**.
4. Catch **3 bad vibes** and the run ends.
5. Classic is endless; Daily is **90s** seeded waves; Zen has no fail state.

## Tuning (`lib/catch-a-vibe/catchConfig.ts`)

| Setting | Value |
| --- | --- |
| Canvas | 520 × 560 |
| Launch vy | 10 – 14.5 |
| Gravity | 0.26 |
| Bad vibe strikes (game over) | 3 |
| Bad spawn | ~3.5% → ~22% over 2 min |
| Combo window | 1400ms |

## API

- `POST/GET /api/scores?gameId=catch-a-vibe&mode=classic|daily&levelId=catch`

## Routes

- Hub card → **CATCH A VIBE**
- Direct: `/catch-a-vibe`

## Assets

Good faces: [`lib/assets/gvcLibraryFaces.ts`](../lib/assets/gvcLibraryFaces.ts).  
Bad Vibes Guy: GVC token **#4113** via IPFS proxy in [`catchFaces.ts`](../lib/catch-a-vibe/catchFaces.ts).
