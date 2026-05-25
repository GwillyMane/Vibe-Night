# Gameplay balance — 20 handcrafted levels (full redesign)

## Overview

All **20** layouts in `lib/handcrafted-levels-data.ts` were replaced with dense, multi-material structures. Authoring uses `lib/level-layout.ts` (placement math, material presets, `starThresholds()`). Every level passes `npx tsx scripts/audit-levels.ts` (no floating/overlapping targets after settle; block motion &lt; 0.32).

## Target density

| Range | Targets per level | Block budget (approx.) |
| --- | --- | --- |
| **1–5** Basics | 2–3 | 14–19 |
| **6–10** Collapse | 3 (8: 2) | 20–24 |
| **11–15** Materials | 2–3 | 18–26 |
| **16–20** Expert | 4–5 | 28–38 |

## Per-level intent

| ID | Name | First-shot idea |
| --- | --- | --- |
| 1 | GATEHOUSE | Glass lintel or crate leg → shelf drops both |
| 2 | WAREHOUSE SPLIT | Glass bridge or shorter left stack |
| 3 | CAGE JAW | Fragile spine posts → shell opens |
| 4 | QUARRY BRIDGE | Glass deck between stone piers |
| 5 | TWIN VAULT | Outer glass panels → inner shelf trio |
| 6 | CASCADE TOWER | Crown glass or mid-tier crate shear |
| 7 | MIRROR COLUMNS | Tie beam → taller right tower |
| 8 | FULCRUM YARD | Counterweight stack or fragile pivot pin |
| 9 | SPILLWAY | Ramp spill or bounce backstop bank |
| 10 | ANGLEWORKS | Fragile posts or glass shelf (open face toward sling; 7 shots) |
| 11 | DROP GATE | Both static fragile posts → slab crush |
| 12 | BANK SILO | Bounce wall into metal hood |
| 13 | IRON AVIARY | Glass struts → inner shelf |
| 14 | DOMINO YARD | Leftmost glass cap → chain |
| 15 | CORE REACTOR | Outer glass tiers → Vibe Core |
| 16 | TWIN SPANS | Glass bridge or island loft |
| 17 | CROWN TILT | Left fragile line → crown glass |
| 18 | GLASS CATHEDRAL | Wing glass → loft shelf |
| 19 | VIBE VAULT | Lintel → bay shelves L→R |
| 20 | FINAL MELTDOWN | Glass shelves → core → satellites |

## Shots / par / stars

- **Basics:** 4–5 shots available, par 3–4; `starThresholds(..., "low")`
- **Collapse / materials:** 5–6 shots, par 4–5; `"mid"` / `"high"` for core-heavy levels
- **Expert:** 7–8 shots, par 6–7 on finales; thresholds scale with target + block counts via `starThresholds()`

## Physics stability notes

- **Static anchors** used sparingly (ground footings, critical lintels/shelves) so mobile loads settle without pre-shot collapse
- **Targets** placed with `seatCircleOnSurface()` from layout helpers; expert finale separates shelf vs mid-tower heights to avoid overlap after settle
- **Global tuning** unchanged from prior pass: 140 settle ticks, gravity 0.84, motion cutoff 0.32 (`lib/physics/createWorld.ts`, `materials.ts`)

## Debug (`?debug=1`)

- Breakable / `weakPoint` blocks outlined on the Matter canvas
- Validation warnings in console on load

## Not changed

- Level IDs `"1"`–`"20"`, chapters, auth, leaderboards, UI shell, scoring replay rules
- No new level count or procedural generation
