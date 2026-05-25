# BIG VIBES — merge physics arcade

**Big Vibes** (`gameId: vibe-merge`) is the second title on **Vibe Night**: a Matter.js drop-and-merge stack game with GVC face art, combo chains, and classic / daily modes.

## Core loop

1. **Aim** — drag horizontally in the drop band; release to drop the current tier (tiers 1–3 only spawn).
2. **Merge** — two equal-tier circles collide → removed and replaced by tier+1 at the midpoint (max tier 10).
3. **Score** — tier-based merge points × combo multiplier (chain window ~1.2s).
4. **Lose** — any face touching the game-over line for **3s** continuously → game over.

## World tuning (`lib/vibe-merge/mergeConfig.ts`)

| Setting | Value |
| --- | --- |
| Logical size | 400 × 640 |
| Gravity | ~1.0 |
| Spawn tiers | 1–4 weighted (classic); daily uses seeded queue |
| Danger line | `dangerY` + `DANGER_OVERFLOW_MS` |

### Tier chain (10)

1–6: Red → Yellow → Mint → Blue → Pink → Purple (GVC library faces).  
7: **Vibefoot** — GVC token `#5275`.  
8: **Chill Vibes Guy** — GVC token `#6731`.  
9: **Candy Blob** — GVC token `#4889`.  
10: **Pebbles and Seeds** — GVC token `#2943`.

Faces: `lib/vibe-merge/mergeFaces.ts` + `/gvc-metadata.json` via IPFS proxy.

### Play backgrounds

Four JPGs in `public/Big Vibes/` — picker on the title screen; choice stored as `playBackgroundId` in `vibe-merge:` localStorage (`lib/vibe-merge/mergeBackgrounds.ts`).

## Modules

| Path | Role |
| --- | --- |
| `mergePhysics.ts` | Matter engine, walls, merge debounce, danger check |
| `mergeQueue.ts` | Weighted `nextPiece` + daily sequence |
| `mergeScoring.ts` | Points + combo labels |
| `mergeDaily.ts` | `todaySeed()` NY daily drop list |
| `mergeStorage.ts` | `vibe-merge:` localStorage (bests, achievements, settings) |
| `mergeScoreValidation.ts` | Server plausible score bounds |
| `components/game/vibe-merge/*` | UI shell, gate chunk `big-vibes-game` |

## Leaderboards

- **POST/GET** `/api/scores` with `gameId=vibe-merge`, `mode=classic|daily`, `levelId=merge`.
- Postgres `leaderboard_scores.game_id` column (default `vibe-crashers` for Crashers).
- Sign-in required to submit; guests can read boards.

## Daily mode

Same `todaySeed()` as Crashers (America/New_York). Pre-generated drop sequence from `seededRandom(seed)` so all players get the same next-piece order for that day.

## Deep link

- Hub: Vibe Night library → **BIG VIBES** card.
- Direct: `/vibe-merge` (lazy gate, back link to hub).

## Physics playtest checklist

1. Drop spacing / wall friction — pieces settle without jitter.
2. Merge spawn — slight upward nudge to avoid floor clip.
3. Tiers 9–10 — fit within ~70% container width.
4. Danger timer — skilled players get ~1–2s recovery.
5. Score pacing — strong classic runs roughly 30k–80k.

## Preview asset

Replace `public/games/big-vibes-preview.png` with a gameplay screenshot when tuned.
