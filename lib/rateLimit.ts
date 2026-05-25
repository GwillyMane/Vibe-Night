/** Best-effort in-memory rate limiter (resets on cold start; OK for MVP). */
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
