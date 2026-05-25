import { BLOOM_RADIUS, colorsMatch } from "./catchConfig";
import type { CatchVibe } from "./catchEntities";

export interface BloomResult {
  cascaded: CatchVibe[];
}

export function findBloomCascade(
  entities: CatchVibe[],
  origin: CatchVibe,
  combo: number
): BloomResult {
  const cascaded: CatchVibe[] = [];
  if (combo < 3 || origin.kind === "bad") return { cascaded };

  for (const v of entities) {
    if (v.id === origin.id || v.state === "absorbing" || v.kind === "bad") continue;
    const dx = v.x - origin.x;
    const dy = v.y - origin.y;
    if (dx * dx + dy * dy > BLOOM_RADIUS * BLOOM_RADIUS) continue;
    if (colorsMatch(origin.colorId, v.colorId)) {
      cascaded.push(v);
    }
  }
  return { cascaded };
}

export function countBloomChainsTriggered(combo: number, prevCombo: number): number {
  if (combo >= 3 && prevCombo < 3) return 1;
  if (combo >= 7 && prevCombo < 7) return 1;
  if (combo >= 10 && combo % 5 === 0 && prevCombo < combo) return 1;
  return 0;
}
