export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

const MAX_PARTICLES = 120;

export function spawnParticles(
  list: Particle[],
  x: number,
  y: number,
  count: number,
  color: string,
  reducedMotion: boolean,
  spread = 4
): void {
  if (reducedMotion) return;
  const n = Math.min(count, 28);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = spread * (0.4 + Math.random() * 0.9);
    list.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s - 1,
      life: 0.85 + Math.random() * 0.35,
      color,
      size: 1.5 + Math.random() * 2.5,
    });
  }
  if (list.length > MAX_PARTICLES) {
    list.splice(0, list.length - MAX_PARTICLES);
  }
}

export function stepParticles(parts: Particle[]): void {
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.life -= 0.045;
    p.x += p.vx * 0.35;
    p.y += p.vy * 0.35;
    p.vy += 0.14;
    if (p.life <= 0) parts.splice(i, 1);
  }
}
