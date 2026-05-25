let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function tone(freq: number, dur: number, vol = 0.08, type: OscillatorType = "sine") {
  const c = ac();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = vol;
  o.connect(g);
  g.connect(c.destination);
  o.start();
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
  o.stop(c.currentTime + dur);
}

export function playShiftSlide(muted: boolean) {
  if (muted) return;
  tone(220, 0.08, 0.06, "triangle");
}

export function playShiftMatch(muted: boolean, cascade = 1) {
  if (muted) return;
  tone(440 + cascade * 40, 0.12, 0.09, "sine");
}

export function playShiftRevert(muted: boolean) {
  if (muted) return;
  tone(120, 0.15, 0.07, "sawtooth");
}

export function playShiftLevelUp(muted: boolean) {
  if (muted) return;
  tone(523, 0.1, 0.08);
  setTimeout(() => tone(659, 0.1, 0.08), 80);
  setTimeout(() => tone(784, 0.15, 0.09), 160);
}

export function playShiftGameOver(muted: boolean) {
  if (muted) return;
  tone(330, 0.2, 0.07);
  setTimeout(() => tone(220, 0.25, 0.06), 120);
}
