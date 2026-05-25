/** Procedural Web Audio for Catch A Vibe. */
let ctx: AudioContext | null = null;
let ambientNodes: { o: OscillatorNode; g: GainNode }[] | null = null;

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
  gain = 0.07,
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

/** @deprecated Replaced by global Vibe Night soundtrack. */
export function startCatchAmbient(_muted?: boolean, _intensity?: number) {
  /* noop */
}

/** @deprecated Replaced by global Vibe Night soundtrack. */
export function stopCatchAmbient() {
  ambientNodes = null;
}

export function playCatchSwish(muted: boolean) {
  tone(muted, 280, 0.05, "sine", 0.05);
  tone(muted, 420, 0.04, "triangle", 0.035, 0.02);
}

export function playCatchSuccess(muted: boolean, combo: number) {
  const base = 180 + combo * 22;
  tone(muted, base, 0.06, "sine", 0.07);
  tone(muted, base * 1.3, 0.05, "triangle", 0.045, 0.03);
  if (combo >= 3) tone(muted, base * 1.55, 0.08, "sine", 0.055, 0.06);
  if (combo >= 5) tone(muted, base * 1.85, 0.1, "triangle", 0.05, 0.09);
}

export function playCatchFullBloom(muted: boolean) {
  tone(muted, 90, 0.35, "sine", 0.09);
  tone(muted, 180, 0.4, "triangle", 0.08, 0.06);
  tone(muted, 360, 0.45, "sine", 0.06, 0.12);
}

export function playCatchCalm(muted: boolean) {
  tone(muted, 140, 0.25, "sine", 0.06);
}

export function playCatchCleanse(muted: boolean) {
  tone(muted, 320, 0.1, "triangle", 0.065);
  tone(muted, 480, 0.08, "sine", 0.05, 0.04);
}

export function playCatchCorruption(muted: boolean) {
  tone(muted, 70, 0.15, "sawtooth", 0.04);
}

export function playCatchMiss(muted: boolean, corrupted: boolean) {
  tone(muted, corrupted ? 90 : 130, 0.12, "sawtooth", corrupted ? 0.05 : 0.035);
}

export function playCatchGameOver(muted: boolean) {
  tone(muted, 180, 0.2, "triangle", 0.06);
  tone(muted, 90, 0.35, "sine", 0.07, 0.08);
}

export function playCatchCombo(muted: boolean, combo: number) {
  if (combo < 5) return;
  tone(muted, 240 + combo * 8, 0.08, "sine", 0.05);
}
