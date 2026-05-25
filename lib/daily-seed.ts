/** Wordle-style daily seed (America/New_York) — same layout for everyone each calendar day. */
export function todaySeed(tz = "America/New_York"): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: tz });
}

export function seededRandom(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

function daysInMonth(y: number, m: number): number {
  if (m === 2 && isLeapYear(y)) return 29;
  return MONTH_DAYS[m - 1] ?? 31;
}

/** Shift a `YYYY-MM-DD` calendar string by whole days (Gregorian; matches `todaySeed()` date strings). */
export function offsetSeedDays(seed: string, deltaDays: number): string {
  let y = Number(seed.slice(0, 4));
  let mo = Number(seed.slice(5, 7));
  let d = Number(seed.slice(8, 10));
  let n = d + deltaDays;
  while (n > daysInMonth(y, mo)) {
    n -= daysInMonth(y, mo);
    mo += 1;
    if (mo > 12) {
      mo = 1;
      y += 1;
    }
  }
  while (n < 1) {
    mo -= 1;
    if (mo < 1) {
      mo = 12;
      y -= 1;
    }
    n += daysInMonth(y, mo);
  }
  return `${y}-${String(mo).padStart(2, "0")}-${String(n).padStart(2, "0")}`;
}
