import { todaySeed, seededRandom } from "@/lib/daily-seed";

export function catchDailySeed(tz = "America/New_York"): string {
  return todaySeed(tz);
}

/** Unique seed per classic run; daily reuses the calendar seed for everyone. */
export function catchRunSeed(mode: "classic" | "daily" | "zen"): string {
  if (mode === "daily") return catchDailySeed();
  if (mode === "zen") return `zen-${Date.now()}`;
  const nonce =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Math.random().toString(36).slice(2)}${Date.now()}`;
  return `classic-${nonce}`;
}

export function catchSpawnRand(runSeed: string): () => number {
  return seededRandom(`catch-spawn:${runSeed}`);
}
