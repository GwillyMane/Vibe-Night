import Matter from "matter-js";
import {
  bowlFloorY,
  colorDef,
  ENGINE_GRAVITY,
  GARDEN_WORLD,
  isInsideGardenSoil,
  MAX_ENTITIES,
  MAX_VELOCITY,
  MIN_PLANT_GAP_MS,
  type GardenColorId,
  type GardenEntityState,
} from "./gardenConfig";

export type GardenEntityKind = "vibe";

export interface GardenEntityPlugin {
  vibe: GardenEntityKind;
  entityId: string;
  colorId: GardenColorId;
  state: GardenEntityState;
  bloomFlash: number;
  juicePop: number;
  juiceSquash: number;
  plantedAt: number;
  corruptPulse: number;
  /** 0–1 shrink-out before entity is removed from the world. */
  dissolve: number;
  /** Bloom resonance ring intensity. */
  resonance: number;
  /** Per-entity idle animation phase. */
  idleSeed: number;
  /** Contamination glow from nearby corruption. */
  nearCorrupt: number;
}

let entityIdSeq = 0;

export function nextEntityId(): string {
  entityIdSeq += 1;
  return `e${entityIdSeq}`;
}

export interface GardenReactionEvent {
  type: "bloom" | "cleanse" | "mutate" | "cascade" | "corrupt" | "pop" | "evict";
  colorId: GardenColorId;
  x: number;
  y: number;
  chain: number;
  points: number;
  label?: string;
}

export type PopReason = "bloom" | "cleanse" | "evict";

export interface PendingPop {
  body: Matter.Body;
  at: number;
  reason: PopReason;
}

export interface CreatedGardenWorld {
  engine: Matter.Engine;
  runner: Matter.Runner;
  walls: Matter.Body[];
  floor: Matter.Body;
  entities: Matter.Body[];
  events: GardenReactionEvent[];
  pendingPops: PendingPop[];
  lastEvict: { x: number; y: number; colorId: GardenColorId } | null;
  plantLockedUntil: number;
  dispose: () => void;
}

function setPlugin(body: Matter.Body, colorId: GardenColorId, state: GardenEntityState = "normal") {
  const p = body.plugin as GardenEntityPlugin;
  p.vibe = "vibe";
  p.colorId = colorId;
  p.entityId = nextEntityId();
  p.state = state;
  p.bloomFlash = 0;
  p.juicePop = 0;
  p.juiceSquash = 0;
  p.plantedAt = performance.now();
  p.corruptPulse = 0;
  p.dissolve = 0;
  p.resonance = 0;
  p.idleSeed = Math.random() * Math.PI * 2;
  p.nearCorrupt = 0;
}

export function pluginOf(body: Matter.Body): GardenEntityPlugin {
  return body.plugin as GardenEntityPlugin;
}

export function createEntityBody(x: number, y: number, colorId: GardenColorId, state: GardenEntityState = "normal"): Matter.Body {
  const def = colorDef(colorId);
  const body = Matter.Bodies.circle(x, y, def.radius, {
    isStatic: false,
    restitution: def.restitution * 0.92,
    friction: def.friction,
    frictionStatic: def.frictionStatic,
    frictionAir: 0.018,
    density: def.density,
    slop: 0.05,
    label: `vibe-${colorId}`,
  });
  setPlugin(body, colorId, state);
  return body;
}

function buildBowlWalls(): Matter.Body[] {
  const w = GARDEN_WORLD.width;
  const h = GARDEN_WORLD.height;
  const wt = GARDEN_WORLD.wallThickness;
  const floorY = bowlFloorY();

  const floor = Matter.Bodies.rectangle(w / 2, floorY + 18, w + wt, 36, {
    isStatic: true,
    friction: 0.95,
    restitution: 0.04,
    label: "floor",
  });

  const left = Matter.Bodies.rectangle(wt / 2, h / 2 + 20, wt, h, {
    isStatic: true,
    friction: 0.9,
    restitution: 0.03,
    label: "wall-l",
  });

  const right = Matter.Bodies.rectangle(w - wt / 2, h / 2 + 20, wt, h, {
    isStatic: true,
    friction: 0.9,
    restitution: 0.03,
    label: "wall-r",
  });

  // Angled bowl corners
  const leftRamp = Matter.Bodies.rectangle(48, floorY - 40, 80, wt, {
    isStatic: true,
    angle: -0.35,
    friction: 0.88,
    restitution: 0.05,
    label: "ramp-l",
  });

  const rightRamp = Matter.Bodies.rectangle(w - 48, floorY - 40, 80, wt, {
    isStatic: true,
    angle: 0.35,
    friction: 0.88,
    restitution: 0.05,
    label: "ramp-r",
  });

  return [floor, left, right, leftRamp, rightRamp];
}

export function createGardenWorld(): CreatedGardenWorld {
  const engine = Matter.Engine.create({
    enableSleeping: true,
    positionIterations: 10,
    velocityIterations: 6,
    constraintIterations: 2,
  });
  engine.gravity.y = ENGINE_GRAVITY;

  const walls = buildBowlWalls();
  Matter.Composite.add(engine.world, walls);

  const entities: Matter.Body[] = [];
  const events: GardenReactionEvent[] = [];
  const pendingPops: PendingPop[] = [];

  const runner = Matter.Runner.create();
  Matter.Runner.run(runner, engine);

  const capVelocity = () => {
    for (const b of entities) {
      const sp = Matter.Vector.magnitude(b.velocity);
      if (sp > MAX_VELOCITY) {
        const s = MAX_VELOCITY / sp;
        Matter.Body.setVelocity(b, { x: b.velocity.x * s, y: b.velocity.y * s });
      }
    }
  };

  const decayJuice = () => {
    const t = performance.now() * 0.001;
    for (const b of entities) {
      const p = pluginOf(b);
      p.bloomFlash = Math.max(0, p.bloomFlash - 0.032);
      p.juicePop = Math.max(0, p.juicePop - 0.028);
      p.juiceSquash = Math.max(0, p.juiceSquash - 0.032);
      p.corruptPulse = Math.max(0, p.corruptPulse - 0.018);
      p.resonance = Math.max(0, p.resonance - 0.022);
      p.nearCorrupt = Math.max(0, p.nearCorrupt - 0.015);
      if (p.dissolve > 0) p.dissolve = Math.max(0, p.dissolve - 0.028);

      if (p.state !== "corrupted" && p.dissolve <= 0) {
        const breath = Math.sin(t * 1.4 + p.idleSeed) * 0.000035;
        Matter.Body.applyForce(b, b.position, { x: breath, y: Math.cos(t * 1.1 + p.idleSeed) * 0.000028 });
      }
    }
  };

  const tickCorruptionProximity = () => {
    for (const b of entities) {
      pluginOf(b).nearCorrupt = Math.max(0, pluginOf(b).nearCorrupt - 0.02);
    }
    for (const b of entities) {
      const p = pluginOf(b);
      if (p.state !== "corrupted") continue;
      const def = colorDef(p.colorId);
      const range = def.radius * 2.35;
      for (const n of entities) {
        if (n === b) continue;
        const dist = Matter.Vector.magnitude(Matter.Vector.sub(n.position, b.position));
        const od = colorDef(pluginOf(n).colorId);
        if (dist > range + od.radius * 0.5) continue;
        const np = pluginOf(n);
        if (np.state === "corrupted") continue;
        np.nearCorrupt = Math.min(1, np.nearCorrupt + 0.08 + p.corruptPulse * 0.12);
      }
    }
  };

  const api: CreatedGardenWorld = {
    engine,
    runner,
    walls,
    floor: walls[0]!,
    entities,
    events,
    pendingPops,
    lastEvict: null,
    plantLockedUntil: 0,
    dispose: () => {
      Matter.Events.off(engine, "afterUpdate");
      Matter.Runner.stop(runner);
      Matter.Engine.clear(engine);
    },
  };

  Matter.Events.on(engine, "afterUpdate", () => {
    capVelocity();
    tickCorruptionProximity();
    decayJuice();
  });

  return api;
}

export function entityCount(world: CreatedGardenWorld): number {
  return world.entities.length;
}

export function overlapsTooMuch(world: CreatedGardenWorld, x: number, y: number, radius: number): boolean {
  for (const b of world.entities) {
    const def = colorDef(pluginOf(b).colorId);
    const dist = Matter.Vector.magnitude(Matter.Vector.sub(b.position, { x, y }));
    if (dist < (def.radius + radius) * 0.85) return true;
  }
  return false;
}

export function canPlant(world: CreatedGardenWorld, x: number, y: number, colorId: GardenColorId, now = performance.now()): boolean {
  if (now < world.plantLockedUntil) return false;
  if (!isInsideGardenSoil(x, y)) return false;
  const def = colorDef(colorId);
  if (overlapsTooMuch(world, x, y, def.radius)) return false;
  return true;
}

/** When at cap, immediately fade the oldest vibe so a new plant can land. */
export function evictOldestForRoom(world: CreatedGardenWorld): { x: number; y: number; colorId: GardenColorId } | null {
  let oldest: Matter.Body | null = null;
  let oldestAt = Infinity;

  for (const b of world.entities) {
    const p = pluginOf(b);
    if (p.dissolve > 0) continue;
    if (p.plantedAt < oldestAt) {
      oldestAt = p.plantedAt;
      oldest = b;
    }
  }

  if (!oldest) return null;
  const p = pluginOf(oldest);
  const info = { x: oldest.position.x, y: oldest.position.y, colorId: p.colorId };
  removeEntity(world, oldest);
  world.pendingPops = world.pendingPops.filter((pp) => pp.body !== oldest);
  return info;
}

export function schedulePop(
  world: CreatedGardenWorld,
  body: Matter.Body,
  delayMs: number,
  reason: PopReason
) {
  if (!world.entities.includes(body)) return;
  if (world.pendingPops.some((p) => p.body === body)) return;
  const p = pluginOf(body);
  p.dissolve = 1;
  p.juicePop = Math.max(p.juicePop, 0.5);
  world.pendingPops.push({ body, at: performance.now() + delayMs, reason });
}

export interface ResolvedPop {
  body: Matter.Body;
  reason: PopReason;
  x: number;
  y: number;
  colorId: GardenColorId;
}

export function tickPendingPops(world: CreatedGardenWorld, now: number): ResolvedPop[] {
  const resolved: ResolvedPop[] = [];
  world.pendingPops = world.pendingPops.filter((pp) => {
    if (now < pp.at) return true;
    if (!world.entities.includes(pp.body)) return false;
    const p = pluginOf(pp.body);
    resolved.push({
      body: pp.body,
      reason: pp.reason,
      x: pp.body.position.x,
      y: pp.body.position.y,
      colorId: p.colorId,
    });
    removeEntity(world, pp.body);
    return false;
  });
  return resolved;
}

export function plantEntity(
  world: CreatedGardenWorld,
  x: number,
  y: number,
  colorId: GardenColorId,
  state: GardenEntityState = "normal"
): Matter.Body | null {
  const now = performance.now();
  if (!canPlant(world, x, y, colorId, now)) return null;

  if (entityCount(world) >= MAX_ENTITIES) {
    const evicted = evictOldestForRoom(world);
    if (!evicted) return null;
    world.lastEvict = evicted;
  }

  const body = createEntityBody(x, y, colorId, state);
  const p = pluginOf(body);
  p.juicePop = 0.65;
  p.juiceSquash = 0.4;
  Matter.Composite.add(world.engine.world, body);
  world.entities.push(body);
  world.plantLockedUntil = now + MIN_PLANT_GAP_MS;

  for (const b of world.entities) {
    if (Matter.Vector.magnitude(Matter.Vector.sub(b.position, { x, y })) < colorDef(colorId).radius * 3) {
      Matter.Sleeping.set(b, false);
    }
  }

  return body;
}

export function addEntityDirect(world: CreatedGardenWorld, x: number, y: number, colorId: GardenColorId, state: GardenEntityState = "normal") {
  const body = createEntityBody(x, y, colorId, state);
  Matter.Composite.add(world.engine.world, body);
  world.entities.push(body);
  return body;
}

export function removeEntity(world: CreatedGardenWorld, body: Matter.Body) {
  const i = world.entities.indexOf(body);
  if (i >= 0) world.entities.splice(i, 1);
  Matter.Composite.remove(world.engine.world, body);
}

export function neighborsOf(
  world: CreatedGardenWorld,
  body: Matter.Body,
  radiusMult = 2.2
): Matter.Body[] {
  const def = colorDef(pluginOf(body).colorId);
  const range = def.radius * radiusMult;
  const out: Matter.Body[] = [];
  for (const other of world.entities) {
    if (other === body) continue;
    const od = colorDef(pluginOf(other).colorId);
    const dist = Matter.Vector.magnitude(Matter.Vector.sub(other.position, body.position));
    if (dist <= range + od.radius * 0.5) out.push(other);
  }
  return out;
}

export function applyRadialImpulse(world: CreatedGardenWorld, x: number, y: number, force: number, range: number) {
  for (const b of world.entities) {
    const vec = Matter.Vector.sub(b.position, { x, y });
    const dist = Matter.Vector.magnitude(vec);
    if (dist > range || dist < 1) continue;
    const n = Matter.Vector.normalise(vec);
    const falloff = 1 - dist / range;
    const f = force * falloff * falloff;
    Matter.Body.applyForce(b, b.position, { x: n.x * f, y: n.y * f });
    Matter.Sleeping.set(b, false);
  }
}

export function applyBloomWave(world: CreatedGardenWorld, x: number, y: number, force: number, range: number) {
  applyRadialImpulse(world, x, y, force, range);
}

export function drainGardenEvents(world: CreatedGardenWorld): GardenReactionEvent[] {
  const e = [...world.events];
  world.events.length = 0;
  return e;
}

export function pushGardenEvent(world: CreatedGardenWorld, ev: GardenReactionEvent) {
  world.events.push(ev);
}

export function setEntityColor(body: Matter.Body, colorId: GardenColorId) {
  const p = pluginOf(body);
  p.colorId = colorId;
  p.state = "normal";
  const def = colorDef(colorId);
  Matter.Body.scale(body, def.radius / (body.circleRadius ?? def.radius), def.radius / (body.circleRadius ?? def.radius));
}

export function markCorrupted(body: Matter.Body) {
  const p = pluginOf(body);
  p.state = "corrupted";
  p.corruptPulse = 1;
}

export function markCleansed(body: Matter.Body) {
  const p = pluginOf(body);
  if (p.state === "corrupted") {
    p.state = "normal";
    p.bloomFlash = 1;
    p.corruptPulse = 0;
  }
}

export function markBlooming(body: Matter.Body) {
  const p = pluginOf(body);
  p.state = "blooming";
  p.bloomFlash = 1;
  p.juicePop = Math.min(1, p.juicePop + 0.35);
}
