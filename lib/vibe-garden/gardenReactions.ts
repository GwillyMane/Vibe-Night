import Matter from "matter-js";
import {
  BLOOM_FULL_POP_CHAIN,
  BLOOM_MAX_HOPS,
  BLOOM_MAX_HOPS_PINK,
  BLOOM_MIN_POP_CHAIN,
  BLOOM_POP_DELAY_MS,
  BLOOM_RADIUS_MULT,
  colorDef,
  type GardenColorId,
} from "./gardenConfig";
import {
  applyRadialImpulse,
  applyBloomWave,
  markBlooming,
  markCleansed,
  markCorrupted,
  neighborsOf,
  pluginOf,
  pushGardenEvent,
  schedulePop,
  setEntityColor,
  type CreatedGardenWorld,
} from "./gardenPhysics";
import {
  baseBloomPoints,
  cleansePoints,
  comboMultiplier,
  goldenBloomBonus,
  milestoneLabel,
} from "./gardenScoring";

export interface BloomResult {
  points: number;
  chain: number;
  labels: string[];
  cleanses: number;
  cascade: boolean;
  pops: number;
  fullBloom: boolean;
}

function scheduleBloomPops(
  world: CreatedGardenWorld,
  origin: Matter.Body,
  participants: Matter.Body[],
  chain: number,
  cleansedIds: Set<string>
) {
  const originId = pluginOf(origin).entityId;
  const fullBloom = chain >= BLOOM_FULL_POP_CHAIN;
  const canPop = chain >= BLOOM_MIN_POP_CHAIN;
  let pops = 0;

  for (const body of participants) {
    const p = pluginOf(body);
    const isOrigin = p.entityId === originId;
    const wasCleansed = cleansedIds.has(p.entityId);

    if (wasCleansed) {
      p.state = "normal";
      p.bloomFlash = Math.max(p.bloomFlash, 0.5);
      continue;
    }

    if (!canPop) {
      if (isOrigin) {
        p.state = "normal";
        p.bloomFlash = Math.max(p.bloomFlash, 0.25);
      }
      continue;
    }

    if (isOrigin && !fullBloom) {
      p.state = "normal";
      p.bloomFlash = Math.max(p.bloomFlash, 0.35);
      continue;
    }

    schedulePop(world, body, BLOOM_POP_DELAY_MS, "bloom");
    pops += 1;
  }

  if (fullBloom) {
    pushGardenEvent(world, {
      type: "cascade",
      colorId: pluginOf(origin).colorId,
      x: origin.position.x,
      y: origin.position.y,
      chain,
      points: 0,
      label: "FULL BLOOM",
    });
  } else if (canPop && pops >= 2) {
    pushGardenEvent(world, {
      type: "bloom",
      colorId: pluginOf(origin).colorId,
      x: origin.position.x,
      y: origin.position.y,
      chain,
      points: 0,
      label: `CHAIN x${chain}`,
    });
  }

  return pops;
}

export function triggerBloomFrom(
  world: CreatedGardenWorld,
  origin: Matter.Body,
  combo: number,
  options: { allowMutate: boolean; amplify: number }
): BloomResult {
  const originDef = colorDef(pluginOf(origin).colorId);
  const maxHops =
    BLOOM_MAX_HOPS + (originDef.extraHops > 0 ? BLOOM_MAX_HOPS_PINK - BLOOM_MAX_HOPS : 0);
  const visited = new Set<string>();
  const participants: Matter.Body[] = [origin];
  const cleansedIds = new Set<string>();
  const queue: { body: Matter.Body; hop: number }[] = [{ body: origin, hop: 0 }];
  let chain = 0;
  let points = 0;
  let cleanses = 0;
  let cascade = pluginOf(origin).colorId === 6;
  const labels: string[] = [];

  markBlooming(origin);
  visited.add(pluginOf(origin).entityId);

  while (queue.length > 0) {
    const { body, hop } = queue.shift()!;
    if (hop > maxHops) continue;

    const p = pluginOf(body);
    const def = colorDef(p.colorId);
    chain += 1;

    p.resonance = Math.min(1, 0.3 + hop * 0.16);
    p.bloomFlash = Math.min(1, 0.4 + hop * 0.14);
    p.juicePop = Math.min(1, p.juicePop + 0.2 + hop * 0.07);
    p.juiceSquash = Math.min(0.85, p.juiceSquash + 0.12);

    if (p.state === "corrupted") {
      markCleansed(body);
      cleansedIds.add(p.entityId);
      const cp = cleansePoints(chain) * options.amplify;
      points += cp;
      cleanses += 1;
      pushGardenEvent(world, {
        type: "cleanse",
        colorId: p.colorId,
        x: body.position.x,
        y: body.position.y,
        chain,
        points: cp,
        label: "CORRUPTION CLEANSE",
      });
    } else {
      const base = baseBloomPoints(p.colorId) * def.bloomMult * options.amplify;
      const mult = comboMultiplier(combo + chain - 1);
      const pts = Math.round(base * mult);
      points += pts;
      if (p.colorId === 6) {
        points += goldenBloomBonus();
        cascade = true;
        labels.push("GOLDEN BLOOM");
      }
      pushGardenEvent(world, {
        type: cascade ? "cascade" : "bloom",
        colorId: p.colorId,
        x: body.position.x,
        y: body.position.y,
        chain,
        points: pts,
      });
    }

    if (def.pushForce > 0.002) {
      const hopForce = def.pushForce * (1 + hop * 0.22);
      applyRadialImpulse(world, body.position.x, body.position.y, hopForce, def.radius * (4.2 + hop * 0.35));
    }

    const neighbors = neighborsOf(world, body, BLOOM_RADIUS_MULT * def.bloomMult);
    for (const n of neighbors) {
      const np = pluginOf(n);
      if (visited.has(np.entityId)) continue;

      const compatible =
        np.colorId === p.colorId ||
        np.state === "corrupted" ||
        p.colorId === 6;

      if (!compatible) continue;

      visited.add(np.entityId);
      markBlooming(n);
      participants.push(n);
      queue.push({ body: n, hop: hop + 1 });

      if (options.allowMutate && p.colorId === 5 && np.state !== "corrupted" && Math.random() < 0.3) {
        const newColor = (Math.floor(Math.random() * 6) as GardenColorId);
        setEntityColor(n, newColor);
        pushGardenEvent(world, {
          type: "mutate",
          colorId: newColor,
          x: n.position.x,
          y: n.position.y,
          chain,
          points: 0,
          label: "MUTATION",
        });
      }
    }
  }

  const ml = milestoneLabel(chain);
  if (ml) labels.push(ml);
  if (cascade) labels.push("REACTION CASCADE");

  const pops = scheduleBloomPops(world, origin, participants, chain, cleansedIds);
  const fullBloom = chain >= BLOOM_FULL_POP_CHAIN;
  if (pops >= 2) labels.push(`+${pops} POP`);
  if (chain >= BLOOM_MIN_POP_CHAIN && chain < BLOOM_FULL_POP_CHAIN) {
    labels.push("CHAIN CLEAR");
  }
  if (fullBloom) {
    labels.push("FULL BLOOM");
    applyBloomWave(world, origin.position.x, origin.position.y, 0.0055 + chain * 0.0004, 210);
  }

  return { points, chain, labels, cleanses, cascade, pops, fullBloom };
}

export function computeAmplify(origin: Matter.Body, world: CreatedGardenWorld): number {
  let amp = 1;
  for (const n of neighborsOf(world, origin, 2.4)) {
    const d = colorDef(pluginOf(n).colorId);
    amp = Math.max(amp, d.amplifyMult);
  }
  return amp;
}

export function plantAndReact(
  world: CreatedGardenWorld,
  body: Matter.Body,
  combo: number,
  allowMutate: boolean
): BloomResult {
  const amp = computeAmplify(body, world);
  return triggerBloomFrom(world, body, combo, { allowMutate, amplify: amp });
}

export function infectEntity(body: Matter.Body) {
  markCorrupted(body);
}
