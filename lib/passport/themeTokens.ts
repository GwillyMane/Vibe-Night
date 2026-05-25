import type { TitleRarity } from "@/lib/profile/catalog";

export const PASSPORT_SIZE = { width: 1080, height: 800 } as const;

/** Shared layout chrome for the landscape passport card. */
export const PASSPORT_LAYOUT = {
  padding: 28,
  headerGap: 16,
  bodyGap: 24,
  heroWidth: 430,
  heroPadding: 22,
  avatarSize: 140,
} as const;

export const PASSPORT_COLORS = {
  bg: "#050505",
  panel: "#0c0c0c",
  card: "#141414",
  gold: "#FFE048",
  pink: "#FF6B9D",
  green: "#2EFF2E",
  white: "#ffffff",
  muted: "#9e9e9e",
  border: "#2a2a2a",
} as const;

/** Satori-safe inline styles only — no boxShadow, no spread. */
export function heroShellStyle(themeId: string): { background: string; border: string } {
  switch (themeId) {
    case "gold-wash":
      return { background: "#161208", border: "2px solid rgba(255,224,72,0.35)" };
    case "cosmic-pink":
      return { background: "#140818", border: "2px solid rgba(255,107,157,0.3)" };
    case "ember-core":
      return { background: "#120c08", border: "2px solid rgba(255,95,31,0.3)" };
    default:
      return { background: "#0c0c0c", border: "2px solid rgba(255,224,72,0.25)" };
  }
}

export function avatarBorderStyle(borderId: string): { border: string } {
  switch (borderId) {
    case "cosmic-halo":
      return { border: "4px solid rgba(255,107,157,0.55)" };
    case "silver-frame":
      return { border: "4px solid rgba(200,200,200,0.4)" };
    default:
      return { border: "4px solid rgba(255,224,72,0.45)" };
  }
}

export function titleColor(rarity: TitleRarity): string {
  switch (rarity) {
    case "legendary":
      return PASSPORT_COLORS.pink;
    case "rare":
      return PASSPORT_COLORS.gold;
    default:
      return "#f5f5f5";
  }
}

export function tierChipStyle(tier: string): { border: string; color: string; background: string } {
  switch (tier) {
    case "Regular":
    case "Crusher":
      return { border: "1px solid rgba(255,224,72,0.45)", color: PASSPORT_COLORS.gold, background: PASSPORT_COLORS.card };
    case "Legend":
      return { border: "1px solid rgba(255,107,157,0.5)", color: PASSPORT_COLORS.pink, background: PASSPORT_COLORS.card };
    default:
      return { border: "1px solid #444444", color: "#d4d4d4", background: PASSPORT_COLORS.card };
  }
}
