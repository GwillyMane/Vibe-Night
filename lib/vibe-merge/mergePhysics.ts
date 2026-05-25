import Matter from "matter-js";
import {
  AIM_PAD_X,
  DANGER_GRACE_MS,
  DANGER_LINE_TOUCH_SLACK,
  DANGER_OVERFLOW_MS,
  dropLineY,
  ENGINE_GRAVITY,
  MAX_VELOCITY,
  MERGE_MAX_TIER,
  MERGE_WORLD,
  MIN_DROP_GAP_MS,
  mergeFloorY,
  SETTLE_ANGULAR_MAX,
  SETTLE_GRACE_MS,
  SETTLE_MAX_SPEED,
  tierDef,
  type MergeTierId,
} from "./mergeConfig";
import {
  applyImpactJuice,
  applyMergeSpawnJuice,
  decayBodyJuice,
  pluginJuice,
} from "./mergeJuice";

export type MergePieceKind = "merge";

export interface MergePiecePlugin {
  vibe: MergePieceKind;
  mergeTier: MergeTierId;
  mergeId: string;
  merging?: boolean;
  droppedAt?: number;
  juicePop?: number;
  juiceSquash?: number;
  mergeFlash?: number;
  juiceTier?: number;
}

let mergeIdSeq = 0;

export function nextMergeId(): string {
  mergeIdSeq += 1;
  return `m${mergeIdSeq}`;
}

export interface MergeEvent {
  type: "merge";
  fromTier: MergeTierId;
  intoTier: MergeTierId;
  x: number;
  y: number;
  scoreTier: MergeTierId;
}

export interface CreatedMergeWorld {
  engine: Matter.Engine;
  runner: Matter.Runner;
  walls: Matter.Body[];
  floor: Matter.Body;
  pieces: Matter.Body[];
  /** Tier shown in launcher (no physics body until drop). */
  holdingTier: MergeTierId | null;
  aimX: number;
  dropLockedUntil: number;
  events: MergeEvent[];
  /** mergeId → performance.now() when piece first touched the game-over line */
  dangerTouchSince: Map<string, number>;
  dispose: () => void;
}

export interface DangerLineState {
  touching: boolean;
  /** 0–1 progress toward game over (longest touching piece). */
  fill: number;
  gameOver: boolean;
}

function setPlugin(body: Matter.Body, tier: MergeTierId, id: string) {
  const p = body.plugin as MergePiecePlugin;
  p.vibe = "merge";
  p.mergeTier = tier;
  p.mergeId = id;
  p.merging = false;
}

export function createMergeBody(x: number, y: number, tier: MergeTierId): Matter.Body {
  const def = tierDef(tier);
  const body = Matter.Bodies.circle(x, y, def.radius, {
    isStatic: false,
    restitution: def.restitution,
    friction: def.friction,
    frictionStatic: def.frictionStatic,
    density: def.density,
    slop: 0.04,
    label: `tier-${tier}`,
  });
  setPlugin(body, tier, nextMergeId());
  return body;
}

export function createMergeWorld(): CreatedMergeWorld {
  const engine = Matter.Engine.create({
    enableSleeping: true,
    positionIterations: 12,
    velocityIterations: 8,
    constraintIterations: 2,
  });
  engine.gravity.y = ENGINE_GRAVITY;

  const { world } = engine;
  const floorY = mergeFloorY();
  const w = MERGE_WORLD.width;
  const h = MERGE_WORLD.height;
  const wt = MERGE_WORLD.wallThickness;

  const floor = Matter.Bodies.rectangle(w / 2, floorY + 20, w + wt * 2, 40, {
    isStatic: true,
    friction: 1,
    restitution: 0.03,
    label: "floor",
  });
  const left = Matter.Bodies.rectangle(-wt / 2 + 4, h / 2, wt, h + 80, {
    isStatic: true,
    friction: 0.95,
    restitution: 0.02,
    label: "wall-l",
  });
  const right = Matter.Bodies.rectangle(w + wt / 2 - 4, h / 2, wt, h + 80, {
    isStatic: true,
    friction: 0.95,
    restitution: 0.02,
    label: "wall-r",
  });

  Matter.Composite.add(world, [floor, left, right]);

  const events: MergeEvent[] = [];
  const pieces: Matter.Body[] = [];
  const pendingMerges = new Set<string>();
  const pairKey = (a: string, b: string) => (a < b ? `${a}:${b}` : `${b}:${a}`);

  const scheduleMerge = (a: Matter.Body, b: Matter.Body) => {
    const pa = a.plugin as MergePiecePlugin;
    const pb = b.plugin as MergePiecePlugin;
    if (pa.merging || pb.merging) return;
    if (pa.mergeTier !== pb.mergeTier) return;
    if (pa.mergeTier >= MERGE_MAX_TIER) return;
    const key = pairKey(pa.mergeId, pb.mergeId);
    if (pendingMerges.has(key)) return;
    pendingMerges.add(key);
    pa.merging = true;
    pb.merging = true;

    const tier = pa.mergeTier;
    const mx = (a.position.x + b.position.x) / 2;
    const my = (a.position.y + b.position.y) / 2 - 3;

    Matter.Composite.remove(world, [a, b]);
    const ai = pieces.indexOf(a);
    if (ai >= 0) pieces.splice(ai, 1);
    const bi = pieces.indexOf(b);
    if (bi >= 0) pieces.splice(bi, 1);

    const into = (tier + 1) as MergeTierId;
    if (into <= MERGE_MAX_TIER) {
      const spawned = createMergeBody(mx, my, into);
      const pop = 0.55 + into * 0.04;
      Matter.Body.setVelocity(spawned, { x: 0, y: -pop });
      applyMergeSpawnJuice(spawned, into);
      const sp = spawned.plugin as MergePiecePlugin;
      sp.droppedAt = performance.now();
      Matter.Composite.add(world, spawned);
      pieces.push(spawned);
      wakePiecesNear(pieces, mx, my, tierDef(into).radius * 2.8);
      events.push({
        type: "merge",
        fromTier: tier,
        intoTier: into,
        x: mx,
        y: my,
        scoreTier: into,
      });
    }

    setTimeout(() => pendingMerges.delete(key), 50);
  };

  const tryPairMerge = (bodyA: Matter.Body, bodyB: Matter.Body) => {
    const ka = (bodyA.plugin as MergePiecePlugin)?.vibe;
    const kb = (bodyB.plugin as MergePiecePlugin)?.vibe;
    if (ka !== "merge" || kb !== "merge") return;
    applyImpactJuice(bodyA, bodyB);
    scheduleMerge(bodyA, bodyB);
  };

  Matter.Events.on(engine, "collisionStart", (ev) => {
    for (const pair of ev.pairs) {
      tryPairMerge(pair.bodyA, pair.bodyB);
    }
  });

  const resolveOverlappingMerges = () => {
    for (let i = 0; i < pieces.length; i++) {
      for (let j = i + 1; j < pieces.length; j++) {
        const a = pieces[i]!;
        const b = pieces[j]!;
        const pa = a.plugin as MergePiecePlugin;
        const pb = b.plugin as MergePiecePlugin;
        if (pa.merging || pb.merging) continue;
        if (pa.mergeTier !== pb.mergeTier || pa.mergeTier >= MERGE_MAX_TIER) continue;
        const r = tierDef(pa.mergeTier).radius;
        const dist = Matter.Vector.magnitude(Matter.Vector.sub(b.position, a.position));
        if (dist < r * 2 * 0.92) scheduleMerge(a, b);
      }
    }
  };

  const runner = Matter.Runner.create();
  Matter.Runner.run(runner, engine);

  const capVelocity = () => {
    for (const b of pieces) {
      const sp = Matter.Vector.magnitude(b.velocity);
      if (sp > MAX_VELOCITY) {
        const s = MAX_VELOCITY / sp;
        Matter.Body.setVelocity(b, { x: b.velocity.x * s, y: b.velocity.y * s });
      }
      if (b.isSleeping && sp > SETTLE_MAX_SPEED * 1.5) {
        Matter.Sleeping.set(b, false);
      }
    }
  };

  let overlapCheckTick = 0;
  const afterUpdate = () => {
    const dt = 16.67;
    for (const b of pieces) decayBodyJuice(b, dt);
    capVelocity();
    overlapCheckTick += 1;
    if (overlapCheckTick % 3 === 0) resolveOverlappingMerges();
  };

  const api: CreatedMergeWorld = {
    engine,
    runner,
    walls: [left, right],
    floor,
    pieces,
    holdingTier: null,
    aimX: w / 2,
    dropLockedUntil: 0,
    events,
    dangerTouchSince: new Map(),
    dispose: () => {
      api.dangerTouchSince.clear();
      Matter.Events.off(engine, "collisionStart");
      Matter.Events.off(engine, "afterUpdate");
      Matter.Runner.stop(runner);
      Matter.Engine.clear(engine);
    },
  };

  Matter.Events.on(engine, "afterUpdate", afterUpdate);

  return api;
}

function wakePiecesNear(pieces: Matter.Body[], x: number, y: number, range: number) {
  for (const b of pieces) {
    if (Matter.Vector.magnitude(Matter.Vector.sub(b.position, { x, y })) < range) {
      Matter.Sleeping.set(b, false);
    }
  }
}

export function decayWorldJuice(world: CreatedMergeWorld, dt: number) {
  for (const b of world.pieces) decayBodyJuice(b, dt);
}

export function isStackSettled(world: CreatedMergeWorld, now = performance.now()): boolean {
  for (const b of world.pieces) {
    const p = pluginJuice(b);
    if (p.droppedAt && now - p.droppedAt < SETTLE_GRACE_MS) return false;
    const sp = Matter.Vector.magnitude(b.velocity);
    const av = Math.abs(b.angularVelocity);
    if (sp > SETTLE_MAX_SPEED || av > SETTLE_ANGULAR_MAX) return false;
  }
  return true;
}

export function setHoldingTier(world: CreatedMergeWorld, tier: MergeTierId) {
  world.holdingTier = tier;
}

export function canDropHeld(world: CreatedMergeWorld, now = performance.now()): boolean {
  if (!world.holdingTier) return false;
  if (now < world.dropLockedUntil) return false;
  return isStackSettled(world, now);
}

export function dropHeldPiece(world: CreatedMergeWorld): Matter.Body | null {
  if (!canDropHeld(world)) return null;
  const tier = world.holdingTier!;
  const def = tierDef(tier);
  const minX = AIM_PAD_X + def.radius;
  const maxX = MERGE_WORLD.width - AIM_PAD_X - def.radius;
  const x = Math.min(maxX, Math.max(minX, world.aimX));

  const dropY = dropLineY();
  const body = createMergeBody(x, dropY, tier);
  const plugin = body.plugin as MergePiecePlugin;
  plugin.droppedAt = performance.now();
  applyMergeSpawnJuice(body, tier);
  pluginJuice(body).juicePop = 0.55;
  Matter.Body.setVelocity(body, { x: 0, y: 1.05 });
  Matter.Composite.add(world.engine.world, body);
  world.pieces.push(body);
  wakePiecesNear(world.pieces, x, dropY, def.radius * 3);
  world.holdingTier = null;
  world.dropLockedUntil = performance.now() + MIN_DROP_GAP_MS;
  return body;
}

export function moveAimX(world: CreatedMergeWorld, x: number) {
  const tier = world.holdingTier ?? 1;
  const def = tierDef(tier);
  const minX = AIM_PAD_X + def.radius;
  const maxX = MERGE_WORLD.width - AIM_PAD_X - def.radius;
  world.aimX = Math.min(maxX, Math.max(minX, x));
}

export function drainMergeEvents(world: CreatedMergeWorld): MergeEvent[] {
  const e = [...world.events];
  world.events.length = 0;
  return e;
}

export function highestPieceTier(world: CreatedMergeWorld): MergeTierId {
  let max = 1 as MergeTierId;
  for (const b of world.pieces) {
    const t = (b.plugin as MergePiecePlugin).mergeTier;
    if (t > max) max = t;
  }
  return max;
}

/** Piece top edge at or above the game-over line (circle intersects the line). */
export function pieceTouchesDangerLine(
  body: Matter.Body,
  dangerY: number,
  slack = DANGER_LINE_TOUCH_SLACK
): boolean {
  const plugin = body.plugin as MergePiecePlugin;
  const top = body.position.y - tierDef(plugin.mergeTier).radius;
  return top <= dangerY + slack;
}

/**
 * Per-piece contact timer: any face touching the line for 3s continuously ends the run.
 */
export function evaluateDangerLine(
  world: CreatedMergeWorld,
  dangerY: number,
  now: number
): DangerLineState {
  const touchingIds = new Set<string>();
  let maxFill = 0;
  let gameOver = false;

  for (const b of world.pieces) {
    const plugin = b.plugin as MergePiecePlugin;
    if (plugin.droppedAt && now - plugin.droppedAt < DANGER_GRACE_MS) continue;
    if (!pieceTouchesDangerLine(b, dangerY)) continue;

    touchingIds.add(plugin.mergeId);
    let since = world.dangerTouchSince.get(plugin.mergeId);
    if (since === undefined) {
      since = now;
      world.dangerTouchSince.set(plugin.mergeId, since);
    }

    const elapsed = now - since;
    maxFill = Math.max(maxFill, Math.min(1, elapsed / DANGER_OVERFLOW_MS));
    if (elapsed >= DANGER_OVERFLOW_MS) gameOver = true;
  }

  for (const id of world.dangerTouchSince.keys()) {
    if (!touchingIds.has(id)) world.dangerTouchSince.delete(id);
  }

  return { touching: touchingIds.size > 0, fill: maxFill, gameOver };
}
