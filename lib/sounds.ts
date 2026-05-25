/**
 * Lightweight Web Audio SFX (no external assets). Mute + volume persist via storage helpers.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  return ctx;
}

export async function resumeAudio(): Promise<void> {
  const c = getCtx();
  if (c?.state === "suspended") await c.resume().catch(() => undefined);
}

function beep(freq: number, durMs: number, type: OscillatorType, gain: number, when?: number) {
  const c = getCtx();
  if (!c) return;
  const t0 = when ?? c.currentTime;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + durMs / 1000);
  o.connect(g);
  g.connect(c.destination);
  o.start(t0);
  o.stop(t0 + durMs / 1000 + 0.02);
}

export function playAimStart(muted: boolean) {
  if (muted) return;
  void resumeAudio();
  beep(440, 45, "sine", 0.04);
}

export function playLaunch(muted: boolean) {
  if (muted) return;
  void resumeAudio();
  beep(220, 90, "triangle", 0.12);
  beep(330, 70, "sine", 0.08, (getCtx()?.currentTime ?? 0) + 0.02);
}

export function playImpact(muted: boolean, intensity = 1) {
  if (muted) return;
  void resumeAudio();
  const g = Math.min(1, intensity);
  beep(90 + 40 * g, 55, "square", 0.09 * g);
}

export function playTargetClear(muted: boolean) {
  if (muted) return;
  void resumeAudio();
  const c = getCtx();
  const t = c?.currentTime ?? 0;
  beep(523, 80, "sine", 0.1, t);
  beep(784, 100, "sine", 0.08, t + 0.06);
}

export function playLevelComplete(muted: boolean) {
  if (muted) return;
  void resumeAudio();
  const c = getCtx();
  const t = c?.currentTime ?? 0;
  [392, 523, 659, 784].forEach((f, i) => beep(f, 120, "triangle", 0.09, t + i * 0.09));
}

export function playGameOver(muted: boolean) {
  if (muted) return;
  void resumeAudio();
  const c = getCtx();
  const t = c?.currentTime ?? 0;
  beep(392, 140, "sawtooth", 0.07, t);
  beep(294, 180, "sawtooth", 0.06, t + 0.14);
}

export function playUiClick(muted: boolean) {
  if (muted) return;
  void resumeAudio();
  beep(880, 35, "sine", 0.05);
}

export function playModalOpen(muted: boolean) {
  if (muted) return;
  void resumeAudio();
  const c = getCtx();
  const t = c?.currentTime ?? 0;
  beep(660, 40, "sine", 0.06, t);
  beep(990, 55, "triangle", 0.05, t + 0.04);
}

export function playComboHit(muted: boolean) {
  if (muted) return;
  void resumeAudio();
  const c = getCtx();
  const t = c?.currentTime ?? 0;
  beep(440, 50, "square", 0.07, t);
  beep(554, 60, "square", 0.06, t + 0.05);
  beep(880, 70, "sine", 0.07, t + 0.1);
}
