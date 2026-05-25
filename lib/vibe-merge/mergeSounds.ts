/** Lightweight Web Audio — punchy merge feedback (no external assets). */
let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function tone(
  muted: boolean,
  freq: number,
  dur: number,
  type: OscillatorType = "sine",
  gain = 0.08,
  delay = 0
) {
  if (muted) return;
  const c = ac();
  if (!c) return;
  if (c.state === "suspended") void c.resume();
  const t0 = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  o.connect(g);
  g.connect(c.destination);
  o.start(t0);
  o.stop(t0 + dur);
}

export function playMergeDrop(muted: boolean) {
  tone(muted, 140, 0.05, "triangle", 0.07);
  tone(muted, 90, 0.08, "sine", 0.04, 0.02);
}

export function playMergePop(muted: boolean, tier: number, combo = 1) {
  const base = 200 + tier * 28 + combo * 12;
  tone(muted, base, 0.1, "sine", 0.1);
  tone(muted, base * 1.5, 0.07, "triangle", 0.05, 0.04);
}

export function playMergeCombo(muted: boolean, combo: number) {
  const steps = Math.min(4, combo);
  for (let i = 0; i < steps; i++) {
    tone(muted, 380 + i * 90 + combo * 15, 0.07, "square", 0.045, i * 0.055);
  }
}

let lastDangerBeat = 0;

export function playMergeDanger(muted: boolean, fill = 0.5) {
  const now = performance.now();
  const interval = 420 - fill * 220;
  if (now - lastDangerBeat < interval) return;
  lastDangerBeat = now;
  tone(muted, 100 + fill * 40, 0.12, "sawtooth", 0.035 + fill * 0.02);
}

export function playMergeGameOver(muted: boolean) {
  tone(muted, 200, 0.18, "sawtooth", 0.07);
  tone(muted, 120, 0.4, "sawtooth", 0.06, 0.12);
  tone(muted, 80, 0.5, "triangle", 0.04, 0.28);
}

export function playBigMerge(muted: boolean, tier: number) {
  tone(muted, 280 + tier * 20, 0.14, "sine", 0.11);
  tone(muted, 520 + tier * 15, 0.18, "sine", 0.09, 0.07);
  tone(muted, 780, 0.12, "triangle", 0.05, 0.14);
}
