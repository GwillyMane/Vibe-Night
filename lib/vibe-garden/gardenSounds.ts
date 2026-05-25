/** Procedural Web Audio for Vibe Garden. */
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
export function startGardenAmbient(_muted?: boolean, _intensity?: number) {
  /* noop */
}

/** @deprecated Replaced by global Vibe Night soundtrack. */
export function stopGardenAmbient() {
  ambientNodes = null;
}

export function playGardenPlant(muted: boolean) {
  tone(muted, 120, 0.06, "triangle", 0.06);
}

export function playGardenBloom(muted: boolean, chain: number) {
  const base = 160 + chain * 20;
  tone(muted, base, 0.07, "sine", 0.065);
  tone(muted, base * 1.25, 0.05, "triangle", 0.04, 0.03);
  if (chain >= 3) tone(muted, base * 1.5, 0.09, "sine", 0.05, 0.06);
  if (chain >= 5) tone(muted, base * 1.85, 0.11, "triangle", 0.045, 0.1);
}

export function playGardenFullBloom(muted: boolean) {
  tone(muted, 90, 0.35, "sine", 0.09);
  tone(muted, 180, 0.4, "triangle", 0.08, 0.06);
  tone(muted, 360, 0.45, "sine", 0.07, 0.12);
  tone(muted, 520, 0.5, "triangle", 0.055, 0.2);
  tone(muted, 720, 0.35, "sine", 0.04, 0.28);
}

export function playGardenCalm(muted: boolean) {
  tone(muted, 280, 0.2, "sine", 0.045);
  tone(muted, 420, 0.25, "triangle", 0.035, 0.08);
}

export function playGardenCleanse(muted: boolean) {
  tone(muted, 420, 0.12, "sine", 0.06);
  tone(muted, 660, 0.1, "triangle", 0.045, 0.05);
}

export function playGardenCorruption(muted: boolean, level: number) {
  tone(muted, 70 + level * 45, 0.18, "sawtooth", 0.028);
  tone(muted, 110 + level * 30, 0.12, "square", 0.015, 0.04);
}

export function playGardenCascade(muted: boolean) {
  tone(muted, 100, 0.2, "sine", 0.08);
  tone(muted, 200, 0.25, "triangle", 0.06, 0.08);
  tone(muted, 320, 0.3, "sine", 0.05, 0.16);
}

export function playGardenGameOver(muted: boolean) {
  tone(muted, 220, 0.25, "sine", 0.08);
  tone(muted, 140, 0.35, "triangle", 0.06, 0.12);
  tone(muted, 70, 0.5, "sawtooth", 0.05, 0.25);
}

export function playGardenPop(muted: boolean, count = 1) {
  tone(muted, 260 + count * 12, 0.05, "triangle", 0.045);
  tone(muted, 380 + count * 8, 0.04, "sine", 0.03, 0.03);
}

export function playGardenCombo(muted: boolean, combo: number) {
  if (combo < 2) return;
  tone(muted, 280 + combo * 10, 0.055, "square", 0.032);
  if (combo >= 4) tone(muted, 360 + combo * 8, 0.06, "triangle", 0.028, 0.04);
}
