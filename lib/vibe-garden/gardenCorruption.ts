import {
  CORRUPTION_MAX,
  CORRUPTION_SPAWN_MS,
  CORRUPTION_SPREAD_MS,
  CLASSIC_GRACE_MS,
  GARDEN_WORLD,
  STABILITY_COLLAPSE_CORRUPTION_MIN,
  STABILITY_CROWD_COUNT,
  STABILITY_MAX,
  colorDef,
  type GardenColorId,
} from "./gardenConfig";
import { pressureMult } from "./gardenBalance";
import {
  addEntityDirect,
  entityCount,
  markCorrupted,
  neighborsOf,
  pluginOf,
  type CreatedGardenWorld,
} from "./gardenPhysics";

export interface GardenCorruptionState {
  meter: number;
  stability: number;
  lastSpreadAt: number;
  lastSpawnAt: number;
  cleansedTotal: number;
}

export function initCorruptionState(): GardenCorruptionState {
  return {
    meter: 4,
    stability: 88,
    lastSpreadAt: 0,
    lastSpawnAt: 0,
    cleansedTotal: 0,
  };
}

export function applyCleanse(state: GardenCorruptionState, chain: number) {
  const meterDrop = Math.min(6, 3 + Math.floor(chain / 3));
  state.meter = Math.max(0, state.meter - meterDrop);
  state.stability = Math.min(STABILITY_MAX, state.stability + Math.min(4, 1 + chain * 0.35));
  state.cleansedTotal += 1;
}

export function applyBloomPressure(state: GardenCorruptionState, chain: number) {
  if (chain < 3) return;
  state.stability = Math.min(STABILITY_MAX, state.stability + Math.min(5, chain * 0.32));
  state.meter = Math.max(0, state.meter - Math.min(2.5, chain * 0.12));
}

export function applyMistake(state: GardenCorruptionState, amount = 5) {
  state.meter = Math.min(CORRUPTION_MAX, state.meter + amount);
  state.stability = Math.max(0, state.stability - 4);
}

export function applyEvictPenalty(state: GardenCorruptionState) {
  state.meter = Math.min(CORRUPTION_MAX, state.meter + 3.5);
  state.stability = Math.max(0, state.stability - 2);
}

function spawnCorruptionSeed(world: CreatedGardenWorld, now: number) {
  const w = GARDEN_WORLD.width;
  const x = 80 + Math.random() * (w - 160);
  const y = 120 + Math.random() * 80;
  const body = addEntityDirect(world, x, y, 0, "corrupted");
  markCorrupted(body);
}

export function tickCorruption(
  world: CreatedGardenWorld,
  state: GardenCorruptionState,
  now: number,
  dtMs: number,
  elapsedMs: number,
  enabled: boolean,
  graceMs = CLASSIC_GRACE_MS
): { spawned: boolean; spread: number } {
  if (!enabled) return { spawned: false, spread: 0 };

  const dt = dtMs / 1000;
  const pressure = pressureMult(elapsedMs);
  const inGrace = graceMs > 0 && elapsedMs < graceMs;

  if (!inGrace) {
    state.meter = Math.min(CORRUPTION_MAX, state.meter + 0.35 * dt * pressure);
  }

  if (state.meter > 0) {
    state.stability = Math.max(
      0,
      state.stability - (0.22 + state.meter * 0.0045) * dt * pressure
    );
  }

  const count = entityCount(world);
  if (count > STABILITY_CROWD_COUNT) {
    const crowd = count - STABILITY_CROWD_COUNT;
    state.stability = Math.max(0, state.stability - crowd * 0.14 * dt);
    state.meter = Math.min(CORRUPTION_MAX, state.meter + crowd * 0.06 * dt);
  }

  let spawned = false;
  const spawnInterval = CORRUPTION_SPAWN_MS / pressure;
  if (!inGrace && now - state.lastSpawnAt >= spawnInterval) {
    state.lastSpawnAt = now;
    if (count < 26) {
      spawnCorruptionSeed(world, now);
      spawned = true;
      state.meter = Math.min(CORRUPTION_MAX, state.meter + 5);
      state.stability = Math.max(0, state.stability - 3);
    }
  }

  let spread = 0;
  const spreadInterval = CORRUPTION_SPREAD_MS / pressure;
  if (!inGrace && now - state.lastSpreadAt >= spreadInterval) {
    state.lastSpreadAt = now;
    for (const b of world.entities) {
      const p = pluginOf(b);
      if (p.state !== "corrupted") continue;
      const neighbors = neighborsOf(world, b, 2.05);
      for (const n of neighbors) {
        const np = pluginOf(n);
        if (np.state === "corrupted") continue;
        const resist = colorDef(np.colorId).corruptionResist;
        if (Math.random() < 0.34 * (1 - resist) * Math.min(1.4, pressure)) {
          markCorrupted(n);
          spread += 1;
          state.meter = Math.min(CORRUPTION_MAX, state.meter + 2.5);
          state.stability = Math.max(0, state.stability - 1.5);
          break;
        }
      }
    }
  }

  const corruptCount = world.entities.filter((b) => pluginOf(b).state === "corrupted").length;
  if (corruptCount > 0) {
    state.meter = Math.min(CORRUPTION_MAX, state.meter + corruptCount * 0.045 * dt * pressure);
    state.stability = Math.max(0, state.stability - corruptCount * 0.028 * dt * pressure);
  }

  return { spawned, spread };
}

export function isGameOver(
  state: GardenCorruptionState,
  entityCountNow: number,
  maxEntities: number,
  zenMode: boolean
): boolean {
  if (zenMode) return false;
  if (state.meter >= CORRUPTION_MAX) return true;
  if (state.stability <= 0 && state.meter >= STABILITY_COLLAPSE_CORRUPTION_MIN) return true;
  void entityCountNow;
  void maxEntities;
  return false;
}

export function pickWeightedColor(rand: () => number): GardenColorId {
  const r = rand();
  if (r < 0.03) return 6;
  const six = r - 0.03;
  const idx = Math.floor(six * 6) % 6;
  return idx as GardenColorId;
}
