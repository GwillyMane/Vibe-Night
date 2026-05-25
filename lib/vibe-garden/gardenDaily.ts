import { todaySeed } from "@/lib/daily-seed";
import { seededRandom } from "@/lib/daily-seed";
import { GARDEN_WORLD, type GardenColorId } from "./gardenConfig";
import { queueFromSeed } from "./gardenQueue";

export interface DailyStartEntity {
  x: number;
  y: number;
  colorId: GardenColorId;
  corrupted?: boolean;
}

export function gardenDailySeed(tz = "America/New_York"): string {
  return todaySeed(tz);
}

export function dailyPlantQueue(seed = gardenDailySeed()) {
  return queueFromSeed(seed);
}

export function dailyStartLayout(seed = gardenDailySeed()): DailyStartEntity[] {
  const rand = seededRandom(`garden-layout:${seed}`);
  const w = GARDEN_WORLD.width;
  const count = 6 + Math.floor(rand() * 4);
  const out: DailyStartEntity[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      x: 100 + rand() * (w - 200),
      y: 180 + rand() * 220,
      colorId: Math.floor(rand() * 6) as GardenColorId,
      corrupted: rand() < 0.18,
    });
  }
  return out;
}

export interface DailyCorruptionEvent {
  atMs: number;
  x: number;
  y: number;
}

export function dailyCorruptionScript(seed = gardenDailySeed()): DailyCorruptionEvent[] {
  const rand = seededRandom(`garden-corrupt:${seed}`);
  const w = GARDEN_WORLD.width;
  const events: DailyCorruptionEvent[] = [];
  for (let t = 10_000; t < 90_000; t += 7_000 + rand() * 5000) {
    events.push({
      atMs: t,
      x: 80 + rand() * (w - 160),
      y: 140 + rand() * 200,
    });
  }
  return events;
}
