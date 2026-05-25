import { GVC_COLOR_ACCENT } from "@/lib/assets/gvcLibraryFaces";
import type { WinTier } from "./luckyConfig";

export interface LuckyFloatLabel {
  text: string;
  sub?: string;
  x: number;
  y: number;
  life: number;
  maxLife: number;
  color: string;
  big: boolean;
}

export interface LuckyParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  kind: "spark" | "coin" | "ring";
  rot?: number;
  rotVel?: number;
}

export interface LuckyJuiceFx {
  labels: LuckyFloatLabel[];
  particles: LuckyParticle[];
  winBanner: string | null;
  winBannerLife: number;
  flashKeys: Set<string>;
  screenFlash: number;
}

export function emptyLuckyJuice(): LuckyJuiceFx {
  return {
    labels: [],
    particles: [],
    winBanner: null,
    winBannerLife: 0,
    flashKeys: new Set(),
    screenFlash: 0,
  };
}

function pushSpark(
  particles: LuckyParticle[],
  x: number,
  y: number,
  color: string,
  speed = 4
) {
  const a = Math.random() * Math.PI * 2;
  const s = speed * (0.5 + Math.random());
  particles.push({
    x,
    y,
    vx: Math.cos(a) * s,
    vy: Math.sin(a) * s - 2,
    life: 1,
    maxLife: 0.5 + Math.random() * 0.5,
    color,
    size: 2 + Math.random() * 4,
    kind: "spark",
  });
}

function pushCoin(particles: LuckyParticle[], x: number, y: number) {
  particles.push({
    x,
    y,
    vx: (Math.random() - 0.5) * 6,
    vy: -4 - Math.random() * 6,
    life: 1,
    maxLife: 0.9 + Math.random() * 0.6,
    color: "#FFE048",
    size: 5 + Math.random() * 4,
    kind: "coin",
    rot: Math.random() * Math.PI,
    rotVel: (Math.random() - 0.5) * 12,
  });
}

function pushRing(particles: LuckyParticle[], x: number, y: number, color: string) {
  particles.push({
    x,
    y,
    vx: 0,
    vy: 0,
    life: 1,
    maxLife: 0.55,
    color,
    size: 8,
    kind: "ring",
  });
}

export function spawnWinJuice(
  juice: LuckyJuiceFx,
  amount: number,
  tier: WinTier,
  cx: number,
  cy: number,
  winningKeys: Set<string>,
  cellCenters?: { x: number; y: number }[]
): LuckyJuiceFx {
  const next: LuckyJuiceFx = {
    ...juice,
    labels: [...juice.labels],
    particles: [...juice.particles],
    flashKeys: new Set(winningKeys),
    screenFlash:
      tier === "legendary" ? 0.35 : tier === "mega" ? 0.28 : tier === "big" ? 0.2 : tier === "super" ? 0.12 : 0.06,
  };

  next.labels.push({
    text: `+${amount.toLocaleString()}`,
    x: cx,
    y: cy - 20,
    life: 1.4,
    maxLife: 1.4,
    color: "#FFE048",
    big: tier === "mega" || tier === "legendary" || tier === "big",
  });

  const burstCount = tier === "nice" ? 12 : tier === "super" ? 24 : tier === "big" ? 36 : 52;
  for (let i = 0; i < burstCount; i++) {
    const a = (Math.PI * 2 * i) / burstCount + Math.random() * 0.3;
    const s = 3 + Math.random() * (tier === "legendary" ? 8 : 5);
    next.particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: 1,
      maxLife: 0.7 + Math.random() * 0.5,
      color: GVC_COLOR_ACCENT[i % GVC_COLOR_ACCENT.length]!,
      size: 2 + Math.random() * 3,
      kind: "spark",
    });
  }

  if (cellCenters?.length) {
    for (const pos of cellCenters) {
      pushRing(next.particles, pos.x, pos.y, "rgba(255,224,72,0.85)");
      for (let i = 0; i < 6; i++) pushSpark(next.particles, pos.x, pos.y, "#FFE048", 3);
    }
  }

  if (tier === "big" || tier === "mega" || tier === "legendary") {
    for (let i = 0; i < (tier === "legendary" ? 18 : 10); i++) {
      pushCoin(next.particles, cx + (Math.random() - 0.5) * 80, cy + (Math.random() - 0.5) * 40);
    }
    next.winBanner = tier === "legendary" ? "LEGENDARY" : tier === "mega" ? "MEGA WIN" : "BIG WIN";
    next.winBannerLife = 1.4;
  }

  return next;
}

export function tickLuckyJuice(juice: LuckyJuiceFx, dt: number): LuckyJuiceFx {
  const labels = juice.labels
    .map((l) => ({ ...l, life: l.life - dt, y: l.y - 55 * dt }))
    .filter((l) => l.life > 0);

  const particles = juice.particles
    .map((p) => {
      if (p.kind === "ring") {
        return { ...p, life: p.life - dt, size: p.size + 120 * dt };
      }
      return {
        ...p,
        life: p.life - dt,
        x: p.x + p.vx,
        y: p.y + p.vy,
        vy: p.vy + (p.kind === "coin" ? 28 : 18) * dt,
        vx: p.vx * (p.kind === "coin" ? 0.98 : 0.96),
        rot: (p.rot ?? 0) + (p.rotVel ?? 0) * dt,
      };
    })
    .filter((p) => p.life > 0);

  return {
    ...juice,
    labels,
    particles,
    winBannerLife: Math.max(0, juice.winBannerLife - dt),
    winBanner: juice.winBannerLife - dt > 0 ? juice.winBanner : null,
    flashKeys: juice.flashKeys,
    screenFlash: Math.max(0, juice.screenFlash - dt * 1.8),
  };
}
