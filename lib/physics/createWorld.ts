import type { Body, Engine, IEventCollision, Runner } from "matter-js";
import Matter from "matter-js";
import type { PhysicsLevelDefinition } from "../levels";
import { WORLD, worldGroundY } from "../levels";
import { matterOptionsForBadVibeTarget, matterOptionsForBlockMaterial } from "./materials";
import {
  getVibeKind,
  setBlockMaterial,
  setBlockMeta,
  setTargetId,
  setTargetPhysics,
  setVibeKind,
} from "./collisions";

export interface CreatedWorld {
  engine: Engine;
  runner: Runner;
  projectile: Body;
  slingRest: { x: number; y: number };
  level: PhysicsLevelDefinition;
  /** Dynamic / static structure bodies used for breakage + scoring (excludes ground/walls/projectile). */
  blocks: Body[];
  /** Static platforms + launcher pad. */
  platforms: Body[];
  targets: Body[];
  allTracked: Body[];
  resetProjectile: () => void;
  dispose: () => void;
}

/** Pre-launch settle — longer pass reduces wobble / false pre-collapse warnings. */
const SETTLE_TICKS = 140;
const SETTLE_DT = 1000 / 60;

export function runPhysicsTicks(MatterLib: typeof Matter, engine: Engine, ticks: number, dt = SETTLE_DT): void {
  for (let i = 0; i < ticks; i++) MatterLib.Engine.update(engine, dt);
}

export function createPhysicsWorld(level: PhysicsLevelDefinition): CreatedWorld {
  const engine = Matter.Engine.create({ enableSleeping: true });
  engine.gravity.y = 0.84;
  const { world } = engine;
  const groundY = worldGroundY();

  const ground = Matter.Bodies.rectangle(WORLD.width / 2, groundY + 40, WORLD.width + WORLD.wallThickness * 2, 80, {
    isStatic: true,
    friction: 0.95,
    restitution: 0.08,
  });
  setVibeKind(ground, "ground");
  ground.label = "ground";

  const leftWall = Matter.Bodies.rectangle(-WORLD.wallThickness / 2, WORLD.height / 2, WORLD.wallThickness, WORLD.height * 2, {
    isStatic: true,
    friction: 0.45,
  });
  setVibeKind(leftWall, "wall");
  leftWall.render.visible = false;

  const rightWall = Matter.Bodies.rectangle(
    WORLD.width + WORLD.wallThickness / 2,
    WORLD.height / 2,
    WORLD.wallThickness,
    WORLD.height * 2,
    { isStatic: true, friction: 0.45 }
  );
  setVibeKind(rightWall, "wall");
  rightWall.render.visible = false;

  const sling = level.slingRest;
  /** Visual-only ledge under the projectile (r≈16); sensor = no collision so launches aren’t blocked. */
  const launcherPadW = 44;
  const launcherPadH = 10;
  const launcherPadY = sling.y + 16 + launcherPadH / 2;
  const launcherPad = Matter.Bodies.rectangle(sling.x, launcherPadY, launcherPadW, launcherPadH, {
    isStatic: true,
    isSensor: true,
    friction: 0.85,
    restitution: 0.05,
  });
  setVibeKind(launcherPad, "platform");
  launcherPad.label = "launcher-pad";

  const platformBodies: Body[] = [launcherPad];
  if (level.platforms) {
    for (const p of level.platforms) {
      const pb = Matter.Bodies.rectangle(p.x, p.y, p.width, p.height, {
        isStatic: true,
        friction: 0.88,
        restitution: 0.06,
        angle: p.rotation ?? 0,
      });
      setVibeKind(pb, "platform");
      pb.label = p.id;
      platformBodies.push(pb);
    }
  }

  const blocks: Body[] = [];

  for (const def of level.blocks) {
    const matOpts = matterOptionsForBlockMaterial(def.material);
    const isStatic = def.bodyType === "static" || def.bodyType === "kinematic";
    const body = Matter.Bodies.rectangle(def.x, def.y, def.width, def.height, {
      isStatic,
      angle: def.rotation ?? 0,
      density: def.density ?? matOpts.density,
      friction: def.friction ?? matOpts.friction,
      frictionStatic: def.frictionStatic ?? matOpts.frictionStatic,
      restitution: def.restitution ?? matOpts.restitution,
    });
    body.sleepThreshold = 32;
    body.label = def.id;
    setVibeKind(body, "block");
    setBlockMaterial(body, def.material);
    setBlockMeta(body, {
      blockId: def.id,
      breakable: def.breakable ?? false,
      breakThreshold: def.breakThreshold,
      blockRole: def.role,
    });
    body.render.visible = false;
    blocks.push(body);
  }

  const targets: Body[] = [];
  const tvBase = matterOptionsForBadVibeTarget();

  for (const def of level.targets) {
    const tv = {
      density: def.density ?? tvBase.density,
      friction: def.friction ?? tvBase.friction,
      frictionStatic: def.frictionStatic ?? tvBase.frictionStatic,
      restitution: def.restitution ?? tvBase.restitution,
    };
    let body: Body;
    if (def.shape === "circle") {
      const r = def.radius ?? 18;
      body = Matter.Bodies.circle(def.x, def.y, r, {
        friction: tv.friction,
        frictionStatic: tv.frictionStatic,
        restitution: tv.restitution,
        density: tv.density,
        angle: def.rotation ?? 0,
      });
    } else {
      const w = def.width ?? 28;
      const h = def.height ?? 28;
      body = Matter.Bodies.rectangle(def.x, def.y, w, h, {
        friction: tv.friction,
        frictionStatic: tv.frictionStatic,
        restitution: tv.restitution,
        density: tv.density,
        angle: def.rotation ?? 0,
      });
    }
    /** `0` = never auto-sleep; resting targets on blocks would otherwise stay asleep when the block is removed. */
    body.sleepThreshold = 0;
    body.label = def.id;
    setVibeKind(body, "target");
    setTargetId(body, def.id);
    setTargetPhysics(body, {
      clearImpactSpeed: def.clearImpactThreshold,
      clearCrushSpeed: def.clearCrushThreshold,
      clearIfFallsBelowY: def.clearIfFallsBelowY,
      clearJoltAngular: def.clearJoltAngular ?? 18,
    });
    body.render.visible = false;
    targets.push(body);
  }

  const spawn = level.projectileSpawn ?? sling;
  const projectile = Matter.Bodies.circle(spawn.x, spawn.y, 16, {
    friction: 0.25,
    restitution: 0.45,
    density: 0.001,
    frictionAir: 0.00165,
    label: "projectile",
  });
  Matter.Body.setStatic(projectile, true);
  setVibeKind(projectile, "projectile");
  projectile.render.visible = false;

  Matter.Composite.add(world, [ground, leftWall, rightWall, ...platformBodies, ...blocks, ...targets, projectile]);

  runPhysicsTicks(Matter, engine, SETTLE_TICKS);

  const runner = Matter.Runner.create();

  function resetProjectile() {
    const rest = level.projectileSpawn ?? level.slingRest;
    Matter.Body.setVelocity(projectile, { x: 0, y: 0 });
    Matter.Body.setAngularVelocity(projectile, 0);
    Matter.Body.setPosition(projectile, { x: rest.x, y: rest.y });
    Matter.Body.setAngle(projectile, 0);
    Matter.Body.setStatic(projectile, true);
    Matter.Sleeping.set(projectile, false);
  }

  function dispose() {
    try {
      Matter.Runner.stop(runner);
    } catch {
      /* Runner.stop needs browser rAF in Node — engine clear is enough for teardown */
    }
    Matter.Engine.clear(engine);
  }

  const allTracked = [...blocks, ...targets, projectile];

  return {
    engine,
    runner,
    projectile,
    slingRest: level.slingRest,
    level,
    blocks,
    platforms: platformBodies,
    targets,
    allTracked,
    resetProjectile,
    dispose,
  };
}

export function pairFromCollision(
  event: IEventCollision<Engine>,
  predicate: (a: Body, b: Body) => boolean
): { a: Body; b: Body } | null {
  for (const p of event.pairs) {
    const { bodyA, bodyB } = p;
    if (predicate(bodyA, bodyB)) return { a: bodyA, b: bodyB };
    if (predicate(bodyB, bodyA)) return { a: bodyB, b: bodyA };
  }
  return null;
}

export function isProjectile(body: Body): boolean {
  return getVibeKind(body) === "projectile";
}
