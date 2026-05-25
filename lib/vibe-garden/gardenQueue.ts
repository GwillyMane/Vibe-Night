import { seededRandom } from "@/lib/daily-seed";
import { GOLD_SPAWN_CHANCE, type GardenColorId } from "./gardenConfig";
import { pickWeightedColor } from "./gardenCorruption";

export class PlantQueue {
  private seq: GardenColorId[];
  private idx = 0;
  dropsUsed = 0;

  constructor(seq: GardenColorId[]) {
    this.seq = seq.length ? seq : [0, 1, 2, 3, 4, 5];
  }

  peek(): GardenColorId {
    return this.seq[this.idx % this.seq.length]!;
  }

  consume(): GardenColorId {
    const c = this.peek();
    this.idx += 1;
    this.dropsUsed += 1;
    return c;
  }
}

export function createPlantQueue(rand: () => number, length = 512): PlantQueue {
  const seq: GardenColorId[] = [];
  for (let i = 0; i < length; i++) {
    seq.push(rand() < GOLD_SPAWN_CHANCE ? 6 : pickWeightedColor(rand));
  }
  return new PlantQueue(seq);
}

export function queueFromSeed(seed: string, length = 512): PlantQueue {
  const rand = seededRandom(`garden:${seed}`);
  return createPlantQueue(rand, length);
}
