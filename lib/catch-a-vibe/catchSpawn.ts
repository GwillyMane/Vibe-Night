import {
  LAUNCH_VY_MAX,
  LAUNCH_VY_MIN,
  SPAWN_INTERVAL_MIN,
  SPAWN_INTERVAL_START_CLASSIC,
  SPAWN_INTERVAL_START_DAILY,
  SPAWN_PRESSURE_RAMP_MS,
} from "./catchConfig";
import { canSpawnMore, createVibe, pickSpawnColor, type CatchVibe } from "./catchEntities";

export interface SpawnScheduler {
  nextSpawnAt: number;
  intervalMs: number;
  startInterval: number;
  rand: () => number;
}

export function createSpawnScheduler(
  rand: () => number,
  mode: "classic" | "daily" | "zen" = "classic"
): SpawnScheduler {
  const startInterval =
    mode === "daily" ? SPAWN_INTERVAL_START_DAILY : mode === "zen" ? 1600 : SPAWN_INTERVAL_START_CLASSIC;
  return {
    nextSpawnAt: mode === "daily" ? 500 : 700,
    intervalMs: startInterval,
    startInterval,
    rand,
  };
}

function launchSpeedBoost(elapsedMs: number): number {
  return 1 + Math.min(0.4, elapsedMs / 240_000);
}

export function tickSpawnScheduler(
  sched: SpawnScheduler,
  entities: CatchVibe[],
  now: number,
  elapsedMs: number
): CatchVibe | null {
  if (now < sched.nextSpawnAt || !canSpawnMore(entities)) return null;

  const opts = pickSpawnColor(sched.rand, elapsedMs);
  const speed = launchSpeedBoost(elapsedMs);
  const baseVy = -(LAUNCH_VY_MIN + sched.rand() * (LAUNCH_VY_MAX - LAUNCH_VY_MIN));
  const vibe = createVibe({ ...opts, vy: baseVy * speed }, sched.rand);

  const pressure = 1 + Math.min(1.8, elapsedMs / SPAWN_PRESSURE_RAMP_MS);
  sched.intervalMs = Math.max(SPAWN_INTERVAL_MIN, sched.startInterval - pressure * (sched.startInterval - SPAWN_INTERVAL_MIN));
  sched.nextSpawnAt = now + sched.intervalMs * (0.72 + sched.rand() * 0.45);

  return vibe;
}
