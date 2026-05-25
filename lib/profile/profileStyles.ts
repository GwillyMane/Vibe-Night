import type { TitleRarity } from "./catalog";

/** Opaque surfaces — profile pages must not rely on site backdrop showing through. */
export const PROFILE_PAGE_SHELL = "relative min-h-[100dvh]";

export const PROFILE_PANEL =
  "overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#0c0c0c] shadow-[0_8px_32px_rgba(0,0,0,0.7)]";

export const PROFILE_PANEL_HEADER =
  "border-b border-[#2a2a2a] bg-[#141414] px-4 py-3.5";

export const PROFILE_PANEL_BODY = "bg-[#0c0c0c] p-4";

export const PROFILE_CARD =
  "rounded-xl border border-[#2a2a2a] bg-[#141414] shadow-[0_2px_12px_rgba(0,0,0,0.45)]";

export const PROFILE_CHIP =
  "rounded-xl border border-[#2a2a2a] bg-[#141414] shadow-[0_2px_8px_rgba(0,0,0,0.4)]";

/** High-contrast typography — avoid white/40–55 on busy backgrounds. */
export const PROFILE_SECTION_TITLE =
  "font-display text-xs font-black uppercase tracking-[0.14em] text-[#FFE048]";

export const PROFILE_SECTION_SUB =
  "mt-1 font-body text-xs leading-relaxed text-[#b3b3b3]";

export const PROFILE_LABEL =
  "font-body text-[11px] font-semibold uppercase tracking-wide text-[#c4c4c4]";

export const PROFILE_BODY = "font-body text-sm leading-snug text-[#efefef]";

export const PROFILE_MUTED = "font-body text-[11px] text-[#9e9e9e]";

export const PROFILE_TEXT_SHADOW =
  "[text-shadow:0_1px_2px_rgba(0,0,0,1),0_2px_12px_rgba(0,0,0,0.85)]";

export function profileBorderClass(borderId: string): string {
  switch (borderId) {
    case "cosmic-halo":
      return "border-pink-accent/55 shadow-[0_0_28px_rgba(255,107,157,0.4)]";
    case "silver-frame":
      return "border-gray-300/40 shadow-[0_0_20px_rgba(200,200,200,0.15)]";
    default:
      return "border-gvc-gold/45 shadow-[0_0_24px_rgba(255,224,72,0.28)]";
  }
}

export function profileAvatarGlowClass(glowId: string): string {
  switch (glowId) {
    case "pink":
      return "shadow-[0_0_40px_rgba(255,107,157,0.35)]";
    case "green":
      return "shadow-[0_0_40px_rgba(46,255,46,0.25)]";
    default:
      return "shadow-[0_0_40px_rgba(255,224,72,0.3)]";
  }
}

export function profileHeroShellClass(themeId: string): string {
  switch (themeId) {
    case "gold-wash":
      return "border-gvc-gold/35 bg-gradient-to-br from-[#0e0e0e] via-[#161208] to-[#0c0c0c]";
    case "cosmic-pink":
      return "border-pink-accent/30 bg-gradient-to-br from-[#0e0c12] via-[#140818] to-[#0c0c0c]";
    case "ember-core":
      return "border-gvc-orange/30 bg-gradient-to-br from-[#120c08] via-[#0e0e0e] to-[#0a0a0a]";
    default:
      return "border-gvc-gold/25 bg-[#0c0c0c]";
  }
}

export function profileBackgroundShowsEmbers(backgroundId: string): boolean {
  return backgroundId === "embers" || backgroundId === "grid";
}

export function titleRarityGlow(rarity: TitleRarity): string {
  switch (rarity) {
    case "legendary":
      return "drop-shadow-[0_0_8px_rgba(255,107,157,0.5)]";
    case "rare":
      return "drop-shadow-[0_0_6px_rgba(255,224,72,0.4)]";
    default:
      return "";
  }
}

/** Hero title colors with solid contrast (not white/70). */
export function profileTitleClass(rarity: TitleRarity): string {
  switch (rarity) {
    case "legendary":
      return "text-[#FF6B9D]";
    case "rare":
      return "text-shimmer";
    default:
      return "text-[#f5f5f5]";
  }
}

export const RARITY_CHIP_CLASS: Record<TitleRarity, string> = {
  common: "border-[#333] bg-[#141414] text-[#d4d4d4]",
  rare: "border-gvc-gold/35 bg-[#1a1608] text-gvc-gold",
  legendary: "border-pink-accent/40 bg-[#1a0a12] text-pink-accent",
};
