import type { Howl } from "howler";

export type AudioZone = "hub" | "game";

export const DUCK_MULTIPLIER: Record<AudioZone, number> = {
  hub: 1,
  game: 0.42,
};

const activeFades = new WeakMap<Howl, number>();

export function cancelFade(howl: Howl): void {
  const id = activeFades.get(howl);
  if (id !== undefined) {
    cancelAnimationFrame(id);
    activeFades.delete(howl);
  }
}

export function fadeVolume(howl: Howl, to: number, ms: number): Promise<void> {
  cancelFade(howl);
  const from = howl.volume();
  if (ms <= 0 || Math.abs(from - to) < 0.001) {
    howl.volume(to);
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const eased = t * t * (3 - 2 * t);
      howl.volume(from + (to - from) * eased);
      if (t < 1) {
        const id = requestAnimationFrame(tick);
        activeFades.set(howl, id);
      } else {
        activeFades.delete(howl);
        resolve();
      }
    };
    const id = requestAnimationFrame(tick);
    activeFades.set(howl, id);
  });
}

export async function crossfadeTracks(
  from: Howl | null,
  to: Howl,
  targetVolume: number,
  ms = 800
): Promise<void> {
  const half = Math.floor(ms / 2);
  if (from && from.playing()) {
    await fadeVolume(from, 0, half);
    from.pause();
  }
  to.volume(0);
  if (!to.playing()) to.play();
  await fadeVolume(to, targetVolume, half);
}

export function effectiveVolume(baseVolume: number, muted: boolean, zone: AudioZone): number {
  if (muted) return 0;
  return baseVolume * DUCK_MULTIPLIER[zone];
}
