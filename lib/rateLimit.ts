/** In-memory fallback (resets on cold start). Upstash used when env vars are set. */
const buckets = new Map<string, number[]>();

export function rateLimitAllow(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const arr = buckets.get(key) ?? [];
  const pruned = arr.filter((t) => now - t < windowMs);
  if (pruned.length >= max) {
    buckets.set(key, pruned);
    return false;
  }
  pruned.push(now);
  buckets.set(key, pruned);
  return true;
}

export function clientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

const upstashUrl = () => process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const upstashToken = () => process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

/** Distributed rate limit when Upstash/KV env is configured; otherwise in-memory. */
export async function rateLimitCheck(key: string, max: number, windowMs: number): Promise<boolean> {
  const url = upstashUrl();
  const token = upstashToken();
  if (!url || !token) {
    return rateLimitAllow(key, max, windowMs);
  }

  const windowSec = Math.max(1, Math.ceil(windowMs / 1000));
  const redisKey = `rl:${key}:${Math.floor(Date.now() / windowMs)}`;

  try {
    const res = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["INCR", redisKey],
        ["EXPIRE", redisKey, windowSec],
      ]),
    });
    if (!res.ok) return rateLimitAllow(key, max, windowMs);
    const data = (await res.json()) as Array<{ result?: number }>;
    const count = Number(data[0]?.result ?? 0);
    return count <= max;
  } catch {
    return rateLimitAllow(key, max, windowMs);
  }
}
