import { seededRandom } from "./daily-seed";
import { HANDCRAFTED_LEVELS } from "./handcrafted-levels-data";
import type { ActiveChallenge, PhysicsLevelDefinition } from "./levels-types";

export * from "./levels-types";
export { b, t } from "./levels-builders";
export { HANDCRAFTED_LEVELS } from "./handcrafted-levels-data";

/** Persisted score key for a daily run (seed + resolved handcrafted id). */
export function dailyPersistKey(seed: string, levelId: string): string {
  return `daily:${seed}:${levelId}`;
}

/** Deterministic handcrafted layout for the calendar-day daily (same for everyone). */
export function dailyHandcraftedLevelId(seed: string): string {
  const r = seededRandom(`daily-handcrafted|${seed}`);
  const idx = Math.floor(r() * HANDCRAFTED_LEVELS.length);
  return HANDCRAFTED_LEVELS[idx]!.id;
}

export function getHandcraftedLevel(id: string): PhysicsLevelDefinition | undefined {
  return HANDCRAFTED_LEVELS.find((l) => l.id === id);
}

export function resolveChallenge(challenge: ActiveChallenge): PhysicsLevelDefinition {
  const id = challenge.kind === "daily" ? dailyHandcraftedLevelId(challenge.seed) : challenge.levelId;
  const base = getHandcraftedLevel(id) ?? HANDCRAFTED_LEVELS[0]!;
  return {
    ...base,
    id: base.id,
  };
}
