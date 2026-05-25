import { SWIPE_MAX_POINTS, SWIPE_TOLERANCE } from "./catchConfig";
import type { CatchVibe } from "./catchEntities";

export interface SwipePoint {
  x: number;
  y: number;
  t: number;
}

export interface SwipeTrail {
  points: SwipePoint[];
  active: boolean;
  pointerId: number | null;
}

export function createSwipeTrail(): SwipeTrail {
  return { points: [], active: false, pointerId: null };
}

export function swipeStart(trail: SwipeTrail, x: number, y: number, pointerId: number) {
  trail.active = true;
  trail.pointerId = pointerId;
  trail.points = [{ x, y, t: performance.now() }];
}

export function swipeMove(trail: SwipeTrail, x: number, y: number) {
  if (!trail.active) return;
  const last = trail.points[trail.points.length - 1];
  const dx = x - last.x;
  const dy = y - last.y;
  if (dx * dx + dy * dy < 4) return;
  trail.points.push({ x, y, t: performance.now() });
  if (trail.points.length > SWIPE_MAX_POINTS) {
    trail.points.shift();
  }
}

export function swipeEnd(trail: SwipeTrail) {
  trail.active = false;
  trail.pointerId = null;
}

export function distToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 0.001) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  return Math.hypot(px - cx, py - cy);
}

export function testSegmentHits(
  vibes: CatchVibe[],
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  tolerance = SWIPE_TOLERANCE
): CatchVibe[] {
  const hits: CatchVibe[] = [];
  for (const v of vibes) {
    if (v.state === "absorbing") continue;
    const d = distToSegment(v.x, v.y, x1, y1, x2, y2);
    if (d <= v.radius + tolerance) hits.push(v);
  }
  return hits;
}

export function updateNearMissGlow(vibes: CatchVibe[], trail: SwipeTrail, nearDist = 36) {
  if (trail.points.length < 2) return;
  const last = trail.points[trail.points.length - 1];
  const prev = trail.points[trail.points.length - 2];
  for (const v of vibes) {
    if (v.state === "absorbing") continue;
    const d = distToSegment(v.x, v.y, prev.x, prev.y, last.x, last.y);
    if (d <= v.radius + nearDist && d > v.radius + SWIPE_TOLERANCE) {
      v.nearSwipe = Math.min(1, v.nearSwipe + 0.35);
    }
  }
}

export function smoothTrailPoints(points: SwipePoint[]): { x: number; y: number }[] {
  if (points.length <= 2) return points.map((p) => ({ x: p.x, y: p.y }));
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < points.length; i++) {
    const prev = points[Math.max(0, i - 1)];
    const curr = points[i];
    const next = points[Math.min(points.length - 1, i + 1)];
    out.push({
      x: (prev.x + curr.x + next.x) / 3,
      y: (prev.y + curr.y + next.y) / 3,
    });
  }
  return out;
}
