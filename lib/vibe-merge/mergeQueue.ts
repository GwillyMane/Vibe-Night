import { seededRandom } from "@/lib/daily-seed";
import type { MergeTierId } from "./mergeConfig";
import { SPAWN_WEIGHTS } from "./mergeConfig";

export type Rng = () => number;

function pickSpawnTier(rng: Rng, maxTier: MergeTierId = 3): MergeTierId {
  const pool = SPAWN_WEIGHTS.filter((s) => s.tier <= maxTier);
  const total = pool.reduce((a, s) => a + s.weight, 0);
  let r = rng() * total;
  for (const s of pool) {
    r -= s.weight;
    if (r <= 0) return s.tier;
  }
  return 1;
}

export function createDropQueue(rng: Rng, count = 512, maxSpawnTier: MergeTierId = 3): MergeTierId[] {
  const q: MergeTierId[] = [];
  for (let i = 0; i < count; i++) q.push(pickSpawnTier(rng, maxSpawnTier));
  return q;
}

export function queueFromSeed(seed: string, maxSpawnTier: MergeTierId = 3): MergeTierId[] {
  return createDropQueue(seededRandom(`merge:${seed}`), 512, maxSpawnTier);
}

/** Deterministic drop order — index advances only after each release. */
export class DropQueue {
  private readonly queue: MergeTierId[];
  private index = 0;

  constructor(queue: MergeTierId[]) {
    this.queue = queue.length > 0 ? queue : [1, 2, 1, 3];
  }

  /** Piece currently in the launcher. */
  current(): MergeTierId {
    return this.queue[this.index % this.queue.length] ?? 1;
  }

  /** Piece after the current one (HUD preview). */
  next(): MergeTierId {
    return this.queue[(this.index + 1) % this.queue.length] ?? 1;
  }

  /** Call once per successful drop. */
  advance(): void {
    this.index++;
  }

  get dropsUsed(): number {
    return this.index;
  }
}
