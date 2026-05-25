/** Web Audio SFX for Lucky Vibes (mirrors shiftSounds pattern). */

let ctx: AudioContext | null = null;

function ac(): AudioContext {
  if (!ctx && typeof window !== "undefined") ctx = new AudioContext();
  return ctx!;
}

function tone(freq: number, dur: number, type: OscillatorType = "sine", vol = 0.08) {
  if (typeof window === "undefined") return;
  try {
    const c = ac();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start();
    o.stop(c.currentTime + dur);
  } catch {
    /* ignore */
  }
}

export function playLuckyPull(muted: boolean) {
  if (muted) return;
  tone(220, 0.08, "triangle", 0.06);
}

export function playLuckyReelStop(muted: boolean, reelIndex: number) {
  if (muted) return;
  tone(180 + reelIndex * 20, 0.06, "sine", 0.05);
}

export function playLuckyWinSmall(muted: boolean) {
  if (muted) return;
  tone(520, 0.1, "sine", 0.07);
  setTimeout(() => tone(780, 0.12, "sine", 0.06), 60);
}

export function playLuckyWinBig(muted: boolean) {
  if (muted) return;
  [440, 554, 659, 880].forEach((f, i) => setTimeout(() => tone(f, 0.15, "triangle", 0.08), i * 80));
}

export function playLuckyFeatureEnter(muted: boolean) {
  if (muted) return;
  tone(330, 0.2, "sawtooth", 0.05);
  setTimeout(() => tone(660, 0.25, "triangle", 0.07), 100);
}

export function playLuckySpinsEnter(muted: boolean) {
  if (muted) return;
  [330, 440, 554, 660, 880].forEach((f, i) => setTimeout(() => tone(f, 0.18, "triangle", 0.07), i * 90));
}

export function playLuckySpinsExit(muted: boolean) {
  if (muted) return;
  tone(880, 0.15, "sine", 0.06);
  setTimeout(() => tone(660, 0.2, "triangle", 0.07), 120);
  setTimeout(() => tone(440, 0.25, "sine", 0.05), 240);
}

export function playLuckyRetrigger(muted: boolean) {
  if (muted) return;
  tone(740, 0.12, "square", 0.05);
  setTimeout(() => tone(988, 0.18, "triangle", 0.08), 80);
}

export function playLuckyMultBump(muted: boolean, mult: number) {
  if (muted) return;
  tone(400 + mult * 15, 0.1, "sine", 0.07);
}

export function playLuckyOrbLock(muted: boolean) {
  if (muted) return;
  tone(300, 0.05, "square", 0.04);
  setTimeout(() => tone(450, 0.08, "sine", 0.05), 40);
}

export function playLuckyGrandVibe(muted: boolean) {
  if (muted) return;
  playLuckyWinBig(muted);
  setTimeout(() => tone(988, 0.3, "triangle", 0.09), 300);
}

export function playLuckyGameOver(muted: boolean) {
  if (muted) return;
  tone(392, 0.2, "sine", 0.06);
  setTimeout(() => tone(294, 0.3, "sine", 0.05), 150);
}
