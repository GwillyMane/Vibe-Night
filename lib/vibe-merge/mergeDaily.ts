import { todaySeed } from "@/lib/daily-seed";
import { queueFromSeed } from "./mergeQueue";

export function mergeDailySeed(tz = "America/New_York"): string {
  return todaySeed(tz);
}

export function dailyDropQueue(seed = mergeDailySeed()): ReturnType<typeof queueFromSeed> {
  return queueFromSeed(seed, 3);
}
