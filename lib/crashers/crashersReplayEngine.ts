import Matter from "matter-js";
import {
  addTargetImpactDamage,
  getBlockMaterial,
  getTargetPhysics,
  getVibeKind,
  TARGET_IMPACT_DAMAGE_POP,
  type VibeBodyPlugin,
} from "@/lib/physics/collisions";
import { createPhysicsWorld } from "@/lib/physics/createWorld";
import { resolveChallenge, getHandcraftedLevel, worldGroundY, type ActiveChallenge } from "@/lib/levels";
import {
  BONUS_PER_REMAINING_SHOT,
  SCORE_BLOCK,
  SCORE_FRAGILE_BREAK,
  SCORE_TARGET,
  SCORE_UNDER_PAR,
  comboBonusForTargets,
} from "@/lib/scoring";

const MIN_FLIGHT_BEFORE_SETTLE_MS = 950;
const SHOT_RESOLVE_DEADLINE_MS = 24000;
const PHYSICS_DT = 1000 / 60;

function closingAlongNormal(
  MatterLib: typeof Matter,
  bodyA: Matter.Body,
  bodyB: Matter.Body,
  collision: Matter.Collision | undefined
): number {
  const n = collision?.normal;
  if (!n) return 0;
  const rv = MatterLib.Vector.sub(bodyB.velocity, bodyA.velocity);
  return Math.abs(MatterLib.Vector.dot(rv, n));
}

function blockBreakThreshold(body: Matter.Body): number | null {
  const p = body.plugin as VibeBodyPlugin | undefined;
  if (!p?.breakable) return null;
  return p.breakThreshold ?? 2.6;
}

function bodySpeed(b: Matter.Body): number {
  return Matter.Vector.magnitude(b.velocity);
}

export interface CrashersShotRecord {
  vx: number;
  vy: number;
  pull?: number;
}

export interface CrashersMovesPayload {
  shots?: CrashersShotRecord[];
  levelId?: string;
  score?: number;
}

function parseMoves(movesJson: string): CrashersMovesPayload | null {
  try {
    return JSON.parse(movesJson) as CrashersMovesPayload;
  } catch {
    return null;
  }
}

function challengeForReplay(mode: string, levelId: string, seed: string | null | undefined): ActiveChallenge {
  if (mode === "daily") {
    return { kind: "daily", levelId, seed: String(seed ?? "") };
  }
  return { kind: "handcrafted", levelId, seed: `level-${levelId}` };
}

/** Headless Matter.js replay — returns expected win score or null if invalid. */
export function replayCrashersScore(input: {
  mode: string;
  levelId: string;
  seed?: string | null;
  score: number;
  movesJson: string;
}): number | null {
  const parsed = parseMoves(input.movesJson);
  if (!parsed?.shots?.length) return null;

  const levelId = parsed.levelId ?? input.levelId;
  if (!getHandcraftedLevel(levelId) && input.mode !== "daily") return null;

  const challenge = challengeForReplay(input.mode, levelId, input.seed);
  const level = resolveChallenge(challenge);
  const worldApi = createPhysicsWorld(level);

  let score = 0;
  const maxShots = level.availableShots;

  let clearedThisLaunch = 0;

  const clearTargetBody = (targetBody: Matter.Body) => {
    if (!worldApi.targets.includes(targetBody)) return;
    Matter.Composite.remove(worldApi.engine.world, targetBody);
    const ix = worldApi.targets.indexOf(targetBody);
    if (ix >= 0) worldApi.targets.splice(ix, 1);
    clearedThisLaunch += 1;
    score += SCORE_TARGET;
  };

  const applyTargetBluntImpact = (
    targetBody: Matter.Body,
    impulse: number,
    opts: { instantAt: number; scale: number; minImpulse: number }
  ) => {
    if (!worldApi.targets.includes(targetBody)) return;
    const meta = getTargetPhysics(targetBody);
    if (!meta) return;
    if (impulse >= opts.instantAt) {
      clearTargetBody(targetBody);
      return;
    }
    if (impulse < opts.minImpulse) return;
    const total = addTargetImpactDamage(targetBody, impulse * opts.scale);
    if (total >= TARGET_IMPACT_DAMAGE_POP) clearTargetBody(targetBody);
  };

  const onCollision = (event: Matter.IEventCollision<Matter.Engine>) => {
    const proj = worldApi.projectile;
    for (const pair of event.pairs) {
      const { bodyA, bodyB, collision } = pair;
      const k1 = getVibeKind(bodyA);
      const k2 = getVibeKind(bodyB);

      if ((k1 === "projectile" && k2 === "target") || (k2 === "projectile" && k1 === "target")) {
        const targetBody = k1 === "target" ? bodyA : bodyB;
        const meta = getTargetPhysics(targetBody);
        if (!meta || !worldApi.targets.includes(targetBody)) continue;
        const impact = closingAlongNormal(Matter, bodyA, bodyB, collision);
        if (impact < meta.clearImpactSpeed) continue;
        clearTargetBody(targetBody);
        continue;
      }

      if ((k1 === "projectile" && k2 === "block") || (k2 === "projectile" && k1 === "block")) {
        const blockBody = k1 === "block" ? bodyA : bodyB;
        if (!worldApi.blocks.includes(blockBody)) continue;
        const th = blockBreakThreshold(blockBody);
        const speed = bodySpeed(proj);
        if (th == null || speed < th) continue;
        const mat = getBlockMaterial(blockBody);
        const fragileLike = mat === "fragile" || mat === "glass" || mat === "vibe_core";
        Matter.Composite.remove(worldApi.engine.world, blockBody);
        const bi = worldApi.blocks.indexOf(blockBody);
        if (bi >= 0) worldApi.blocks.splice(bi, 1);
        for (const t of worldApi.targets) Matter.Sleeping.set(t, false);
        for (const b of worldApi.blocks) {
          if (!b.isStatic) Matter.Sleeping.set(b, false);
        }
        score += fragileLike ? SCORE_FRAGILE_BREAK : SCORE_BLOCK;
        continue;
      }

      if ((k1 === "block" && k2 === "target") || (k2 === "block" && k1 === "target")) {
        const targetBody = k1 === "target" ? bodyA : bodyB;
        const meta = getTargetPhysics(targetBody);
        if (!meta || !worldApi.targets.includes(targetBody)) continue;
        const crush = closingAlongNormal(Matter, bodyA, bodyB, collision);
        if (crush >= meta.clearCrushSpeed) {
          clearTargetBody(targetBody);
          continue;
        }
        applyTargetBluntImpact(targetBody, crush, {
          instantAt: meta.clearCrushSpeed * 0.92,
          scale: 0.82,
          minImpulse: 0.08,
        });
        continue;
      }

      if (
        (k1 === "target" && (k2 === "ground" || k2 === "platform")) ||
        (k2 === "target" && (k1 === "ground" || k1 === "platform"))
      ) {
        const targetBody = k1 === "target" ? bodyA : bodyB;
        const meta = getTargetPhysics(targetBody);
        if (!meta || !worldApi.targets.includes(targetBody)) continue;
        const imp = closingAlongNormal(Matter, bodyA, bodyB, collision);
        applyTargetBluntImpact(targetBody, imp, {
          instantAt: meta.clearCrushSpeed * 1.05,
          scale: 0.48,
          minImpulse: 0.42,
        });
        continue;
      }

      if ((k1 === "target" && k2 === "wall") || (k2 === "target" && k1 === "wall")) {
        const targetBody = k1 === "target" ? bodyA : bodyB;
        const meta = getTargetPhysics(targetBody);
        if (!meta || !worldApi.targets.includes(targetBody)) continue;
        const imp = closingAlongNormal(Matter, bodyA, bodyB, collision);
        applyTargetBluntImpact(targetBody, imp, {
          instantAt: meta.clearCrushSpeed * 1.35,
          scale: 0.22,
          minImpulse: 1.15,
        });
        continue;
      }

      if (k1 === "target" && k2 === "target") {
        const imp = closingAlongNormal(Matter, bodyA, bodyB, collision);
        if (imp < 0.48) continue;
        const metaA = getTargetPhysics(bodyA);
        const metaB = getTargetPhysics(bodyB);
        const ref = Math.min(metaA?.clearCrushSpeed ?? 3, metaB?.clearCrushSpeed ?? 3);
        const opts = { instantAt: ref * 1.45, scale: 0.34, minImpulse: 0.52 };
        if (worldApi.targets.includes(bodyA)) applyTargetBluntImpact(bodyA, imp, opts);
        if (worldApi.targets.includes(bodyB)) applyTargetBluntImpact(bodyB, imp, opts);
      }
    }
  };

  const onCollisionActive = (event: Matter.IEventCollision<Matter.Engine>) => {
    for (const pair of event.pairs) {
      const { bodyA, bodyB, collision } = pair;
      const k1 = getVibeKind(bodyA);
      const k2 = getVibeKind(bodyB);
      if ((k1 === "block" && k2 === "target") || (k2 === "block" && k1 === "target")) {
        const targetBody = k1 === "target" ? bodyA : bodyB;
        const meta = getTargetPhysics(targetBody);
        if (!meta || !worldApi.targets.includes(targetBody)) continue;
        const crush = closingAlongNormal(Matter, bodyA, bodyB, collision);
        if (crush < meta.clearCrushSpeed * 1.08) continue;
        clearTargetBody(targetBody);
      }
    }
  };

  const tickWorld = () => {
    const gy = worldGroundY();
    for (const t of [...worldApi.targets]) {
      const meta = getTargetPhysics(t);
      if (!meta) continue;
      if (t.position.y > meta.clearIfFallsBelowY) {
        clearTargetBody(t);
      } else if (
        Math.abs(t.angularVelocity) >= (meta.clearJoltAngular ?? 22) &&
        bodySpeed(t) > 5.5 &&
        t.position.y < gy - 70
      ) {
        clearTargetBody(t);
      }
    }
  };

  Matter.Events.on(worldApi.engine, "collisionStart", onCollision);
  Matter.Events.on(worldApi.engine, "collisionActive", onCollisionActive);

  const shots = parsed.shots.slice(0, maxShots + 2);
  let shotsUsed = 0;

  try {
    for (const shot of shots) {
      if (worldApi.targets.length === 0) break;

      clearedThisLaunch = 0;
      worldApi.resetProjectile();
      const body = worldApi.projectile;
      Matter.Body.setStatic(body, false);
      Matter.Sleeping.set(body, false);
      Matter.Body.setVelocity(body, { x: shot.vx, y: shot.vy });
      Matter.Body.setAngularVelocity(body, Matter.Common.clamp(shot.vx * 0.0018, -0.52, 0.52));

      shotsUsed += 1;
      let elapsed = 0;
      const minFlightUntil = MIN_FLIGHT_BEFORE_SETTLE_MS;

      while (elapsed < SHOT_RESOLVE_DEADLINE_MS) {
        Matter.Engine.update(worldApi.engine, PHYSICS_DT);
        tickWorld();

        const p = worldApi.projectile;
        if (!p.isStatic) {
          Matter.Body.setAngularVelocity(p, Matter.Common.clamp(p.velocity.x * 0.0032, -0.55, 0.55));
        }

        if (worldApi.targets.length === 0) break;

        if (elapsed >= minFlightUntil) {
          const gy = worldGroundY();
          const sp = bodySpeed(p);
          const projectileSettled = sp < 0.06;
          let blocksSettled = true;
          for (const b of worldApi.blocks) {
            if (b.isStatic) continue;
            if (bodySpeed(b) > 0.09) {
              blocksSettled = false;
              break;
            }
          }
          const oob = p.position.y > gy + 220;
          if ((projectileSettled && blocksSettled) || oob) break;
        }

        elapsed += PHYSICS_DT;
      }

      if (clearedThisLaunch >= 2) {
        score += comboBonusForTargets(clearedThisLaunch);
      }
    }

    if (worldApi.targets.length > 0) return null;

    const shotsLeft = Math.max(0, maxShots - shotsUsed);
    let finalTotal = score + shotsLeft * BONUS_PER_REMAINING_SHOT;
    if (shotsUsed <= level.parShots) {
      finalTotal += SCORE_UNDER_PAR;
    }

    return finalTotal;
  } finally {
    Matter.Events.off(worldApi.engine, "collisionStart", onCollision);
    Matter.Events.off(worldApi.engine, "collisionActive", onCollisionActive);
    worldApi.dispose();
  }
}
