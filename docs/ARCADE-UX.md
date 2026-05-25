# Vibe Night — Arcade UX

Shared UX patterns across all four Vibe Night titles.

## Shell components

| Component | Path | Role |
| --- | --- | --- |
| `ArcadeTitleShell` | `components/arcade/ArcadeTitleShell.tsx` | Unified title screen chrome |
| `ArcadeEmberBackdrop` | `components/arcade/ArcadeEmberBackdrop.tsx` | Floating gold embers |
| `ArcadeSecondaryGrid` | `components/arcade/ArcadeSecondaryGrid.tsx` | Leaders / Goals / Collection / Settings |
| `ArcadeLeaderboardPanel` | `components/arcade/ArcadeLeaderboardPanel.tsx` | Classic + daily leaderboard tabs |
| `ArcadeResultActions` | `components/arcade/ArcadeResultActions.tsx` | One more run / Share / Menu |
| `UnifiedAchievementPanel` | `components/arcade/UnifiedAchievementPanel.tsx` | Locked/unlocked achievement list |
| `FirstRunCoachOverlay` | `components/arcade/FirstRunCoachOverlay.tsx` | Skippable first-run tips |

Style tokens live in `components/game/gamePanelStyles.ts`.

## Onboarding

- **Storage key:** `vibe-night:onboarded:{gameId}` (`lib/arcade/onboarding.ts`)
- **Trigger:** First time entering the playing phase for that game
- **Steps:** 3–4 coach marks, under 15 seconds, skippable

## Daily ecosystem

- **Copy:** `lib/arcade/dailyCopy.ts` — `Today's daily · {seed}`
- **Cross-game streak:** `lib/arcade/nightStreak.ts` — key `vibe-night:streak`, bumps once per NY calendar day when starting any daily mode
- **Hub stats:** `lib/arcade/hubStats.ts` — daily best per game on library cards

## Share

- **Helper:** `lib/arcade/share.ts` — `buildArcadeShareText`, `twitterIntent`, `copyShareText`, `dailyChallengeUrl`
- **Hashtags:** `#GoodVibesClub #VibeNight #Vibeathon`
- **OG cards:** `GET /api/og/score?game=&name=&score=&mode=`

## HUD rules

1. Gameplay canvas ≥ 70% visual weight on mobile
2. No duplicate metrics (one strike indicator, one combo callout)
3. Instructional copy in onboarding + title rules hint, not persistent HUD
4. Throttle React HUD updates (~120ms); never `setState` every rAF for timers

## Modes

| Game | Classic | Daily | Zen / Practice |
| --- | --- | --- | --- |
| Vibe Crashers | Levels | Daily crash | Practice (unlimited shots, no submit) |
| Big Vibes | Endless stack | Seeded drops | — |
| Vibe Garden | Endless | 90s seeded | Zen sandbox |
| Catch A Vibe | Endless | 90s seeded | Zen catch |
| Vibe Shift | 10 levels | 35 moves seeded | — |
| Lucky Vibes | 30 spins | 25 spins seeded | Unlimited zen |
