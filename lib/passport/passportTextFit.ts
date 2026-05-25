/** Brice display uppercase — estimated glyph width in em units for Satori layout. */
function usernameGlyphUnits(char: string): number {
  if (/[IILJ1!|]/.test(char)) return 0.4;
  if (/[MWQG@%]/.test(char)) return 0.92;
  if (/[A-Z0-9]/.test(char)) return 0.72;
  return 0.62;
}

export function estimateUsernameWidth(text: string, fontSize: number, letterSpacingEm = 0): number {
  const upper = text.toUpperCase();
  if (!upper) return 0;
  let units = 0;
  for (const ch of upper) units += usernameGlyphUnits(ch);
  return units * fontSize + Math.max(0, upper.length - 1) * fontSize * letterSpacingEm;
}

export interface PassportUsernameFit {
  fontSize: number;
  letterSpacing: string;
  lines: string[];
}

/**
 * Fit a passport display name inside a fixed pixel width.
 * Shrinks type first, then splits onto two lines if still too wide.
 */
export function fitPassportUsername(
  username: string,
  maxWidth: number,
  maxSize = 34,
  minSize = 15
): PassportUsernameFit {
  const text = username.trim() || "PLAYER";

  for (let size = maxSize; size >= minSize; size -= 1) {
    const letterSpacingEm = size >= 22 ? 0.015 : 0;
    const letterSpacing = size >= 22 ? "0.015em" : "0em";
    if (estimateUsernameWidth(text, size, letterSpacingEm) <= maxWidth) {
      return { fontSize: size, letterSpacing, lines: [text.toUpperCase()] };
    }
  }

  const minSpacing = "0em";
  const upper = text.toUpperCase();
  const splitAt = Math.ceil(upper.length / 2);
  const lineA = upper.slice(0, splitAt).trim();
  const lineB = upper.slice(splitAt).trim();
  const lines = lineB ? [lineA, lineB] : [lineA];

  for (const line of lines) {
    if (estimateUsernameWidth(line, minSize, 0) > maxWidth) {
      return { fontSize: Math.max(12, minSize - 2), letterSpacing: minSpacing, lines };
    }
  }

  return { fontSize: minSize, letterSpacing: minSpacing, lines };
}

export function passportUsernameMaxWidth(heroWidth: number, heroPadding: number): number {
  return heroWidth - heroPadding * 2;
}
