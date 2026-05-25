# VIBE NIGHT

**Vibe Night** is the Good Vibes Club game hub: one account, shared leaderboards, and multiple arcade titles. This repo ships:

| Title | `gameId` | Mechanics |
| --- | --- | --- |
| **Vibe Crashers** | `vibe-crashers` | Matter.js slingshot puzzles — 20 handcrafted levels + daily |
| **Big Vibes** | `vibe-merge` | Drop-and-merge stack physics — classic & daily seeded drops |
| **Vibe Garden** | `vibe-garden` | Tap-to-plant ecosystem — bloom chains, corruption, zen mode |
| **Catch A Vibe** | `catch-a-vibe` | Swipe-to-catch arcade — combos, bloom cascades, daily waves |
| **Vibe Shift** | `vibe-shift` | Slide-match puzzle — row/column shifts, daily board |
| **Lucky Vibes** | `lucky-vibes` | 6×5 ways slot — Lucky Spins, Vibe Lock, premium GVC tokens |

Built with Next.js, React, TypeScript, Tailwind, Framer Motion, and Matter.js using the GVC brand system from `CLAUDE.md`.

**Arcade UX:** See [`docs/ARCADE-UX.md`](docs/ARCADE-UX.md) for shared shell, onboarding, daily streak, HUD, and share patterns.

## Big Vibes (merge)

- **Play:** Vibe Night home → **BIG VIBES** card, or `/vibe-merge`.
- **Loop:** Aim and drop GVC vibe faces (tiers 1–4 spawn); equal tiers merge up a 10-step chain; overflow the danger line to lose.
- **Modes:** **Classic** (weighted random drops) and **Daily** (same drop sequence for everyone via NY `todaySeed()`).
- **Meta:** Local bests, achievements, goals, collection flags (`lib/vibe-merge/mergeStorage.ts`); leaderboard via `GET/POST /api/scores?gameId=vibe-merge`.
- **Docs:** [`docs/BIG-VIBES.md`](docs/BIG-VIBES.md) — tuning, tier table, API notes.

## Vibe Garden (ecosystem)

- **Play:** Vibe Night home → **VIBE GARDEN** card, or `/vibe-garden`.
- **Loop:** Tap to plant GVC vibes; chain blooms; contain corruption before the garden collapses.
- **Modes:** **Classic** (endless), **Daily** (90s seeded), **Zen** (sandbox, no fail).
- **Meta:** Local bests, achievements, goals (`lib/vibe-garden/gardenStorage.ts`); leaderboard via `GET/POST /api/scores?gameId=vibe-garden`.
- **Docs:** [`docs/VIBE-GARDEN.md`](docs/VIBE-GARDEN.md).

## Catch A Vibe (swipe arcade)

- **Play:** Vibe Night home → **CATCH A VIBE** card, or `/catch-a-vibe`.
- **Loop:** Swipe through upward-launching GVC vibes; chain matching catches; dodge Bad Vibes Guy — catch 3 and you're out.
- **Modes:** **Classic** (endless), **Daily** (90s seeded), **Zen** (sandbox, no fail).
- **Meta:** Local bests, achievements, goals (`lib/catch-a-vibe/catchStorage.ts`); leaderboard via `GET/POST /api/scores?gameId=catch-a-vibe`.
- **Docs:** [`docs/CATCH-A-VIBE.md`](docs/CATCH-A-VIBE.md).

## Lucky Vibes (ways slot)

- **Play:** Vibe Night home → **LUCKY VIBES** card, or `/lucky-vibes`.
- **Loop:** Spin a 6×5 reel cabinet; match GVC faces and premium tokens (#430, #1151, #1400) across 1,024 ways; trigger Lucky Spins or Vibe Lock.
- **Modes:** **Classic** (30 spins), **Daily** (25 seeded spins), **Zen** (unlimited).
- **Meta:** Local bests, achievements (`lib/lucky-vibes/luckyStorage.ts`); leaderboard via `GET/POST /api/scores?gameId=lucky-vibes`.
- **Docs:** [`docs/LUCKY-VIBES.md`](docs/LUCKY-VIBES.md).

## Vibe Crashers (slingshot)

## GVC asset layer

- **Projectile skins:** Default **Shaka** (`/shaka.png`), **gold orb**, **badge** placeholder, **library face** art, or **sample GVC token** art from `/gvc-metadata.json` (IPFS via same-origin `/api/ipfs-proxy`). Choice is stored locally (`vibe-sling:projectile-skin`).
- **Board paint:** Blocks use GVC material styles (glass / crate / stone / metal / bounce / fragile / **vibe_core**). Bad-vibe **targets** are full Matter.js bodies (circles or rounded boxes) with the library face texture, gold accents, and spin from real physics. The projectile draws on canvas with glow, trail, and spin.
- **Background:** GVC library backdrops — each handcrafted level id `1`–`20` maps to a backdrop (`lib/assets/gvcLevelBackgrounds.ts`).
- **Achievement & goal badges:** Official GVC **Badges** art from the [Good Vibes Club Library](https://goodvibesclub.ai/library) is snapshotted in `public/gvc-brand-badges.json` (101 filenames → CDN URLs). `lib/gvcRewardBadges.ts` maps each in-game achievement slug and goal id to a library badge for toasts, the result sheet, and the Goals panel (cosmetic pairing; adjust mappings there). Refresh the JSON if new badges ship: `node -e "fetch('https://goodvibesclub.ai/api/brand?category=badges').then(r=>r.json()).then(d=>{const o={};for(const a of d.assets||[])o[a.filename]=a.image_url;require('fs').writeFileSync('public/gvc-brand-badges.json',JSON.stringify(o));console.log(Object.keys(o).length);})"`.

## Handcrafted physics levels

- **Data:** `lib/handcrafted-levels-data.ts` defines **20** authored layouts (`HANDCRAFTED_LEVELS`), re-exported from `lib/levels.ts`. Each level includes chapter, par, star thresholds, hints, and lists of dynamic blocks (material → Matter tuning from `lib/physics/materials.ts`) plus **dynamic** bad-vibe targets with impact / crush / fall-below / jolt clear rules.
- **World:** `lib/physics/createWorld.ts` builds Matter bodies, runs a short **settle** simulation on load, and wires collision plugins for breakable pieces and target thresholds.
- **Daily:** `dailyHandcraftedLevelId(seed)` uses `seededRandom` to pick **one of the 20** handcrafted levels for that seed — same geometry for everyone; no procedural tower. Scores persist under `daily:{seed}:{levelId}`.
- **Debug:** Add **`?debug=1`** for body outlines and labels on the Matter canvas (breakable / weak-point blocks highlighted in orange), plus a short debug line under the board. `lib/physics/levelValidation.ts` logs **spawn/support** checks (floating targets, overlapping targets, out-of-bounds, blocks still moving after settle) — only when debug is on. See **`docs/GAMEPLAY-BALANCE.md`** for the latest level-tuning notes.
- **FX:** Gold/pink particle bursts, impact flash, light screen shake, star burst on win; reduced via `prefers-reduced-motion`. Gameplay uses a **dark arena fill** on the Matter canvas (`gameplayArena` in `matterBoardPaint.ts`) so the global site grid does not compete with the stage.
- **Sounds:** Web Audio hooks for aim start, launch, impacts, clears, combo, level complete, game over, UI, modal open (see `lib/sounds.ts`).

## How to play

1. Open the app and pick any **handcrafted level** from the list (grouped by chapter), or **Daily challenge** (one of the 20 levels; index is deterministic from the seed).
2. **Drag** the projectile back from the sling anchor, aim, and **release** to launch (mouse or touch). The board uses **`touch-action: none`** on the canvas so drags do not scroll the page.
3. Clear **bad-vibe targets** with direct impacts, crushing contacts, falls past the pit line, or strong off-ground jolts. Only **breakable** blocks shatter when the projectile exceeds their tuned threshold; other blocks absorb energy and transfer force.
4. **Shots** and **par** are **per level** (see HUD). **Win** by clearing all targets. **Lose** if shots are exhausted with targets remaining.
5. **Mobile-first shell:** compact top HUD (level, score with spring pulse, shots, vibe thumbnail, leaderboard), **bottom action bar** (back, restart, pause, sound + second row for **Goals** and **Leaders**) with 44px+ touch targets. Pause uses the same **GameModal** chrome as the menu. On desktop the same shell is centered like a cabinet / large phone frame — layout is not desktop-first.
6. **Arcade feedback:** floating world labels for clears, glass breaks, combos, and win-line callouts (one-shot / under par); respects `prefers-reduced-motion`.
7. **Local goals:** `lib/goals.ts` + `GoalsPanel` track progress from `localStorage` (menu + in-run modal). Completing goals this run surfaces on the **result sheet**.
8. **Result sheet:** bottom sheet on phones (centered card on larger screens) with staggered stars, **animated score count-up**, **best** for that level/daily key, shots used / max, **Retry**, **Next** (when applicable), **Share**, **Copy crash** (multi-line share text), optional **Leaders** shortcut, plus lines for **goals completed** and **new achievements** when present.

## Daily challenge

- By default the daily layout uses **today’s calendar date** (America/New_York) as the seed so everyone sees the same **authored** level for that day.
- Append **`?seed=custom-value`** to the URL to preview or share a specific daily pick; the resolved level is still one of the 20 handcrafted layouts.

## Scoring (transparent)

| Source | Points |
| --- | --- |
| Each fragile / glass **breakable** block destroyed | `65` |
| Each other **breakable** block destroyed | `45` |
| Combo (2+ targets in **one** launch) | `180` × *(extra targets beyond the first)* |
| Shots remaining when you **win** | `110` × each remaining shot |
| Win at or **under par** shots | `140` (one-time bonus) |

**Stars (1–3)** use per-level score thresholds from the level definition (`starThresholds.twoStarsMin` / `threeStarsMin`).

## Vibeathon: submit & share

- Play your best run on any **handcrafted level** or **Daily challenge**, then tap **Share** on the result card to open a pre-filled post on X with your crash summary and tags (**#GoodVibesClub #Vibeathon**). Use **Copy crash** for the full multi-line brag text. Edit the text before posting if you like.
- Take a **screenshot** of the result screen or your HUD score for Discord / gallery submissions if the jam asks for proof.

## Local vs backend

| Feature | Behavior |
| --- | --- |
| Gameplay, physics, scoring | **100% client-side** |
| Sound mute, best scores, achievements, daily completion, recent score | **`localStorage`** first (safe no-op if storage fails) |
| Accounts (optional) | **Username + password** via `/api/auth/*`; **httpOnly** session cookie; guest play unchanged |
| Logged-in wins | **`POST /api/scores`** stores a row and upserts **level** or **daily** progress; duplicate `run_hash` within ~15 minutes is ignored |
| Leaderboard panel | **`GET /api/scores`** (daily / weekly / all-time, `level` or `daily` mode); falls back to **local rows** if the API errors or the DB is unavailable |
| Cloud progress | **`GET /api/progress/me`** and **`POST /api/progress/sync`** merge server data with local state (never downgrade server bests; achievements union; goals max progress / OR completed) |

### Environment (Neon Postgres)

Create **`.env.local`** in the project root (Next.js loads it automatically; it is listed in `.gitignore`). You can start from `.env.example` and paste your real values there. Set:

- **`DATABASE_URL`** — Neon (or any Postgres) connection string. If unset, auth and score routes return a clear JSON error (app still **builds** and **guest play** works).
- **`AUTH_COOKIE_NAME`** — session cookie name (default `vibe_crashers_session`).
- **`AUTH_SESSION_DAYS`** — cookie / session lifetime in days (default `30`).

Tables are created on first use by `lib/db.ts` → `ensureTables()`: **`users`** (username + password hash only — no email), **`sessions`** (stores **SHA-256** of the raw token only), **`leaderboard_scores`**, **`user_level_progress`**, **`user_daily_progress`**, **`user_achievements`**, **`user_goals`**, **`user_settings`**.

### API surface (summary)

- **`POST /api/auth/register`**, **`POST /api/auth/login`**, **`POST /api/auth/logout`**, **`GET /api/auth/me`**
- **`GET /api/scores`** — `scope`, `mode`, `levelId`, `seed`, `limit`, `includeMe`
- **`POST /api/scores`** — authenticated; body includes `mode`, `levelId`, `score`, `stars`, `shotsUsed`, `shotsTotal`, optional `seed`, `won`, `run_hash`, `moves_json`
- **`GET /api/progress/me`**, **`POST /api/progress/sync`** — authenticated; sync runs after login/register so local progress can merge upward

### Future upgrades

Wallet login and full Matter.js score replay for Vibe Crashers remain future work; Shift and Lucky Vibes now verify scores server-side via move replay.

## Production deploy

1. Copy `.env.example` → `.env.local` and set:
   - `DATABASE_URL` — Neon **pooled** URL (`-pooler` hostname)
   - `NEXT_PUBLIC_APP_URL` — production domain (OG + passport links)
   - `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — passports + `vibe-night-assets` bucket
2. Run **`npm run migrate`** once per deploy (schema DDL; disabled on API hot path in production).
3. Run **`npm run upload:screenshots`** if you add new dev/marketing PNGs under `/public`.
4. Health check: **`GET /api/health`**
5. CI: GitHub Actions runs `lint` + `build` on push/PR (`.github/workflows/ci.yml`).

Dev screenshots live at `lib/devScreenshots.ts` → Supabase `vibe-night-assets/dev-screenshots/`.

## Scripts

```bash
npm run dev       # start dev server
npm run dev:clean # npm run clean + free port 3000 + next dev (use this if chunks 404 — see below)
npm run free-port # kill process listening on :3000 (Windows: PowerShell; Unix: fuser)
npm run clean     # delete .next + node_modules/.cache
npm run lint
npm run build
npm run migrate   # apply Postgres schema (run on deploy)
npm run upload:screenshots  # push /public/Screenshot*.png to Supabase
```

### `/_next/static/chunks/...` 404 (e.g. `main-app.js`, `app-pages-internals.js`)

Usually **two dev servers** or a **zombie `next dev` on port 3000**: the terminal starts **Next on 3001** (“Port 3000 is in use”), but the browser still hits **3000** and gets an old/broken HTML shell that references chunks this server never built.

1. Stop every `next dev` / Node you have for this project.
2. Run **`npm run dev:clean`** (clears `.next`, frees **3000**, starts one dev server).
3. Open the URL the terminal prints (often **`http://localhost:3000`** after freeing the port).
4. Hard-refresh the tab (**Ctrl+Shift+R**) so the browser drops cached HTML.

**Still broken?** Check DevTools → **Network** for red `/_next/static/` lines: **(blocked)** often means a privacy extension or corporate proxy; **404** on hashed filenames after a successful compile usually means **stale tab** (hard refresh) or **HTML from a different origin/port** than the scripts. In the app, **Try again** on the error card re-runs the game `import()` with retries (transient network / one-off HMR glitches); if the message persists, use **Reload page** after `dev:clean`.

**Production / preview:** ensure you are not mixing an old HTML shell with a new deployment (CDN or browser cache). Vercel and similar redeploys invalidate old chunks — force-refresh once after each deploy if you had the site open during deploy.

## Development notes

- The game bundle loads **only in the browser** (`GameClientGate` uses `import()` after mount, with **chunk-load retries** and a **Try again** control) so Matter.js is not pulled into the server RSC graph.
- Brand colors, fonts, shimmer, and particles follow **`CLAUDE.md`** and `app/globals.css`.
