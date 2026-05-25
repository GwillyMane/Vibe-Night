/** Shared arcade panel chrome — modals, sheets, pause. */
export const arcadeBackdropClass =
  "fixed inset-0 z-[90] flex items-end justify-center bg-black/80 p-0 backdrop-blur-md sm:items-center sm:p-5";

export const arcadePanelClass =
  "relative z-10 w-full max-w-lg overflow-hidden rounded-t-3xl border border-gvc-gold/25 border-b-0 bg-[#0c0c0c]/96 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-6 shadow-[0_-32px_100px_rgba(0,0,0,0.85)] sm:max-h-[min(92dvh,820px)] sm:rounded-3xl sm:border-b sm:pb-6 card-glow";

export const arcadeTitleShellClass =
  "relative z-30 mx-auto flex w-full max-w-md flex-col gap-4 overflow-hidden rounded-3xl border border-gvc-gold/20 bg-[#0a0a0a] px-6 py-8 shadow-[0_0_80px_rgba(0,0,0,0.92)] card-glow isolate";

export const arcadeTitleShellWideClass =
  "relative z-30 mx-auto flex min-h-[min(92dvh,880px)] w-full max-w-lg flex-col gap-4 overflow-hidden rounded-3xl border border-gvc-gold/20 bg-[#0a0a0a] px-4 py-6 text-center shadow-[0_0_80px_rgba(0,0,0,0.92)] card-glow isolate sm:px-7 sm:py-8";

/** Opaque panel behind title copy so site backdrop art never washes out text. */
export const arcadeTitleHeaderPanelClass =
  "relative z-10 rounded-2xl border border-white/[0.08] bg-[#0a0a0a] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_12px_40px_rgba(0,0,0,0.55)]";

export const arcadeTitleSectionPanelClass =
  "relative z-10 rounded-2xl border border-white/[0.08] bg-[#0a0a0a]/98 px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.45)]";

export const arcadeTitleEyebrowClass =
  "font-display text-[10px] font-bold uppercase tracking-[0.35em] text-white/55";

export const arcadeTitleTaglineClass =
  "mt-3 font-body text-sm leading-relaxed text-white/78 [text-shadow:0_1px_12px_rgba(0,0,0,0.85)]";

export const arcadeTitleHeadingClass =
  "mt-2 font-display font-black uppercase text-shimmer drop-shadow-[0_2px_16px_rgba(0,0,0,0.95)]";

export const arcadePrimaryCtaClass =
  "relative min-h-[56px] rounded-2xl bg-gvc-gold font-display text-lg font-black uppercase text-gvc-black shadow-[0_0_36px_rgba(255,224,72,0.35)] transition-transform hover:scale-[1.02] active:scale-[0.98]";

export const arcadeDailyCtaClass =
  "relative min-h-[48px] rounded-xl border border-pink-accent/35 bg-pink-accent/10 font-display text-sm font-bold uppercase text-pink-accent transition hover:border-pink-accent/55 hover:bg-pink-accent/15 active:scale-[0.98]";

export const arcadeZenCtaClass =
  "relative min-h-[48px] rounded-xl border border-gvc-green/35 bg-gvc-green/10 font-display text-sm font-bold uppercase text-gvc-green transition hover:border-gvc-green/55 hover:bg-gvc-green/15 active:scale-[0.98]";

export const arcadeSecondaryBtnClass =
  "relative z-10 flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-white/12 bg-[#0a0a0a] px-2 font-display text-[10px] font-bold uppercase tracking-wide text-white/82 transition hover:border-gvc-gold/35 hover:text-gvc-gold active:scale-[0.98]";

export const arcadeRulesHintClass =
  "mt-2 rounded-lg border border-white/12 bg-black/80 px-3 py-2.5 font-body text-[11px] leading-relaxed text-white/72 [text-shadow:0_1px_8px_rgba(0,0,0,0.8)]";

export const arcadeBackLinkClass =
  "relative z-10 self-start rounded-lg border border-white/10 bg-black/80 px-2.5 py-1.5 font-display text-[10px] font-bold uppercase text-white/70 transition hover:border-gvc-gold/35 hover:text-gvc-gold";

export const arcadeHeaderRow = "mb-4 flex items-start justify-between gap-3 border-b border-white/[0.06] pb-3";

export const arcadeTitleClass = "font-display text-xl font-black uppercase tracking-wide text-shimmer";

export const arcadeCloseBtnClass =
  "shrink-0 rounded-xl border border-white/12 bg-black/40 p-2 text-white/65 transition hover:border-gvc-gold/40 hover:text-gvc-gold active:scale-[0.97]";

export const arcadeTabRow = "mb-3 flex rounded-xl border border-white/[0.08] bg-black/50 p-1";

export const arcadeTabBtn = (active: boolean) =>
  `flex-1 rounded-lg px-2 py-2 font-body text-[11px] font-bold uppercase tracking-wide transition ${
    active ? "bg-gvc-gold text-gvc-black shadow-[0_0_20px_rgba(255,224,72,0.25)]" : "text-white/45 hover:text-white/75"
  }`;

export const arcadeResultCardClass =
  "relative z-40 mx-auto w-full max-w-md rounded-3xl border border-gvc-gold/25 bg-[#0c0c0c]/95 px-6 py-8 card-glow";

export const arcadeShareBtnClass =
  "min-h-[44px] rounded-xl border border-pink-accent/35 font-display text-xs font-bold uppercase text-pink-accent transition hover:border-pink-accent/55 hover:bg-pink-accent/10 active:scale-[0.98]";

export const arcadeMenuBtnClass =
  "min-h-[44px] rounded-xl border border-white/12 font-display text-xs font-bold uppercase text-white/55 transition hover:border-white/25 hover:text-white/75 active:scale-[0.98]";
