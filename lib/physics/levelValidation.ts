import type Matter from "matter-js";
import type { Body, Engine } from "matter-js";
import { WORLD } from "../levels-types";
import { getVibeKind } from "./collisions";

export interface LevelValidationOptions {
  debug: boolean;
  label: string;
}

function dbgWarn(opts: LevelValidationOptions, msg: string) {
  if (opts.debug) console.warn(`[vibe-sling level ${opts.label}] ${msg}`);
}

/** After bodies exist + settle ticks, emit debug-only warnings for bad spawns / unsupported targets. */
export function validateLevelPhysics(
  MatterLib: typeof Matter,
  engine: Engine,
  targets: Body[],
  opts: LevelValidationOptions
): void {
  const all = MatterLib.Composite.allBodies(engine.world);
  const supportBodies = all.filter((b) => {
    const k = getVibeKind(b);
    if (k === "block") return true;
    if (k === "ground") return true;
    if (k === "platform" && !b.isSensor) return true;
    return false;
  });

  const margin = 24;
  for (const t of targets) {
    const b = t.bounds;
    if (b.min.x < -margin || b.max.x > WORLD.width + margin || b.min.y < -margin || b.max.y > WORLD.height + margin) {
      dbgWarn(
        opts,
        `Target ${t.label ?? "?"} bounds [${b.min.x.toFixed(0)},${b.min.y.toFixed(0)}]–[${b.max.x.toFixed(0)},${b.max.y.toFixed(0)}] extend outside world (${WORLD.width}×${WORLD.height}).`
      );
    }

    const cols = MatterLib.Query.collides(t, supportBodies);
    if (cols.length === 0) {
      dbgWarn(opts, `Target ${t.label ?? "?"} has no Matter collision with ground/blocks/solid platforms — likely floating.`);
    }

    for (const u of targets) {
      if (u === t) continue;
      if (MatterLib.Query.collides(t, [u]).length > 0) {
        dbgWarn(opts, `Target ${t.label ?? "?"} overlaps another target ${u.label ?? "?"} at spawn.`);
        break;
      }
    }

    let minDist = Infinity;
    for (const s of supportBodies) {
      const d = MatterLib.Vector.magnitude(MatterLib.Vector.sub(t.position, s.position));
      minDist = Math.min(minDist, d);
    }
    if (minDist > 120 && cols.length > 0) {
      /* supported but far centroid — informational only if colliding */
    } else if (minDist > 120) {
      dbgWarn(opts, `Target ${t.label ?? "?"} may be far from structure (>${120}px nearest centroid).`);
    }

    const speed = MatterLib.Vector.magnitude(t.velocity) + Math.abs(t.angularVelocity) * 6;
    if (speed > 2.5) {
      dbgWarn(
        opts,
        `Target ${t.label ?? "?"} still moving fast after settle (speed≈${speed.toFixed(2)}) — check supports / sleep.`
      );
    }
    if (t.position.y < 40) {
      dbgWarn(opts, `Target ${t.label ?? "?"} is very high on screen (y=${t.position.y.toFixed(0)}) — verify placement.`);
    }
  }

  for (const b of all) {
    if (getVibeKind(b) !== "block" || b.isStatic) continue;
    const sp = MatterLib.Vector.magnitude(b.velocity) + Math.abs(b.angularVelocity) * 10;
    if (sp > 0.32) {
      dbgWarn(
        opts,
        `Dynamic block ${b.label ?? "?"} still in motion after settle (≈${sp.toFixed(2)}) — structure may collapse before the first shot.`
      );
    }
  }
}
