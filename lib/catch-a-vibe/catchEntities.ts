import {
  CATCH_WORLD,
  GOLD_SPAWN_CHANCE,
  GRAVITY,
  LAUNCH_VY_MAX,
  LAUNCH_VY_MIN,
  MAX_ENTITIES,
  MAX_VELOCITY,
  BAD_VIBE_RADIUS,
  badSpawnChance,
  type CatchColorId,
  type CatchVibeState,
} from "./catchConfig";

let nextId = 1;

export interface CatchVibe {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  colorId: CatchColorId;
  state: CatchVibeState;
  kind: "good" | "bad" | "golden";
  radius: number;
  rotation: number;
  spin: number;
  idleSeed: number;
  absorb: number;
  juicePop: number;
  nearSwipe: number;
  bloomFlash: number;
  badPulse: number;
}

export interface SpawnOpts {
  colorId?: CatchColorId;
  bad?: boolean;
  golden?: boolean;
  x?: number;
  vy?: number;
}

export function createVibe(opts: SpawnOpts = {}, rand: () => number = Math.random): CatchVibe {
  const w = CATCH_WORLD.width;
  const x = opts.x ?? CATCH_WORLD.spawnMargin + rand() * (w - CATCH_WORLD.spawnMargin * 2);
  const golden = opts.golden ?? false;
  const bad = opts.bad ?? false;
  let colorId = opts.colorId;
  if (colorId === undefined) {
    if (golden) colorId = 6;
    else colorId = Math.floor(rand() * 6) as CatchColorId;
  }
  const def = golden ? { radius: 30 } : bad ? { radius: BAD_VIBE_RADIUS } : { radius: 26 };
  const state: CatchVibeState = golden ? "golden" : bad ? "bad" : "normal";
  const kind = golden ? "golden" : bad ? "bad" : "good";
  const launchVy = opts.vy ?? -(LAUNCH_VY_MIN + rand() * (LAUNCH_VY_MAX - LAUNCH_VY_MIN));
  return {
    id: nextId++,
    x,
    y: CATCH_WORLD.playBottom + 16,
    vx: (rand() - 0.5) * 2.4,
    vy: launchVy,
    colorId,
    state,
    kind,
    radius: def.radius,
    rotation: rand() * Math.PI * 2,
    spin: (rand() - 0.5) * 0.08,
    idleSeed: rand() * 100,
    absorb: 0,
    juicePop: 0,
    nearSwipe: 0,
    bloomFlash: 0,
    badPulse: 0,
  };
}

export function pickSpawnColor(rand: () => number, elapsedMs: number): SpawnOpts {
  if (rand() < GOLD_SPAWN_CHANCE) return { golden: true, colorId: 6 };
  if (rand() < badSpawnChance(elapsedMs)) return { bad: true };
  return { colorId: Math.floor(rand() * 6) as CatchColorId };
}

export function tickEntities(entities: CatchVibe[], dtMs: number): { escaped: CatchVibe[]; remaining: CatchVibe[] } {
  const dt = dtMs / 16;
  const escaped: CatchVibe[] = [];
  const remaining: CatchVibe[] = [];

  for (const e of entities) {
    if (e.state === "absorbing") {
      e.absorb = Math.min(1, e.absorb + dtMs / 280);
      e.juicePop = Math.max(0, e.juicePop - dt * 0.08);
      e.bloomFlash = Math.max(0, e.bloomFlash - dt * 0.06);
      if (e.absorb >= 1) continue;
      remaining.push(e);
      continue;
    }

    e.vy += GRAVITY * dt;
    e.vx *= 0.998;
    const sp = Math.hypot(e.vx, e.vy);
    if (sp > MAX_VELOCITY) {
      e.vx = (e.vx / sp) * MAX_VELOCITY;
      e.vy = (e.vy / sp) * MAX_VELOCITY;
    }
    e.x += e.vx * dt;
    e.y += e.vy * dt;
    e.rotation += e.spin * dt;
    e.juicePop = Math.max(0, e.juicePop - dt * 0.05);
    e.bloomFlash = Math.max(0, e.bloomFlash - dt * 0.05);
    e.nearSwipe = Math.max(0, e.nearSwipe - dt * 0.04);
    if (e.kind === "bad") {
      e.badPulse = 0.5 + Math.sin(performance.now() * 0.013 + e.idleSeed) * 0.35;
    }

    if (e.y < CATCH_WORLD.escapeTop || e.y > CATCH_WORLD.escapeBottom) {
      escaped.push(e);
      continue;
    }
    remaining.push(e);
  }

  return { escaped, remaining };
}

export function canSpawnMore(entities: CatchVibe[]): boolean {
  const active = entities.filter((e) => e.state !== "absorbing" || e.absorb < 0.5);
  return active.length < MAX_ENTITIES;
}

export function activeEntities(entities: CatchVibe[]): CatchVibe[] {
  return entities.filter((e) => e.state !== "absorbing" || e.absorb < 0.95);
}

export function startAbsorb(vibe: CatchVibe) {
  vibe.state = "absorbing";
  vibe.absorb = 0;
  vibe.juicePop = 1;
  vibe.bloomFlash = 0.8;
  vibe.vx = 0;
  vibe.vy = 0;
}
