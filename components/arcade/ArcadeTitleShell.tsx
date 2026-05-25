"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import type { ReactNode } from "react";
import { AccountButton } from "@/components/game/AccountButton";
import {
  arcadeDailyCtaClass,
  arcadePrimaryCtaClass,
  arcadeRulesHintClass,
  arcadeTitleEyebrowClass,
  arcadeTitleHeaderPanelClass,
  arcadeTitleHeadingClass,
  arcadeTitleSectionPanelClass,
  arcadeTitleShellWideClass,
  arcadeTitleTaglineClass,
  arcadeZenCtaClass,
} from "@/components/game/gamePanelStyles";
import { playUiClick } from "@/lib/sounds";
import { ArcadeEmberBackdrop } from "./ArcadeEmberBackdrop";

export interface ArcadeTitleShellProps {
  title: string;
  tagline: ReactNode;
  rulesHint?: string;
  muted: boolean;
  onBack?: () => void;
  backdropExtra?: ReactNode;
  backgroundPicker?: ReactNode;
  primaryCta: { label: string; onClick: () => void };
  dailyCta?: { label: string; onClick: () => void };
  zenCta?: { label: string; onClick: () => void };
  /** Hero content — daily panel, etc. Wrapped in section panel when `heroInSection` is true. */
  children?: ReactNode;
  heroInSection?: boolean;
  secondaryGrid?: ReactNode;
  headerExtra?: ReactNode;
  footer?: ReactNode;
  showShaka?: boolean;
}

export function ArcadeTitleShell({
  title,
  tagline,
  rulesHint,
  muted,
  onBack,
  backdropExtra,
  backgroundPicker,
  primaryCta,
  dailyCta,
  zenCta,
  children,
  heroInSection = true,
  secondaryGrid,
  headerExtra,
  footer,
  showShaka = true,
}: ArcadeTitleShellProps) {
  const c = () => playUiClick(muted);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={arcadeTitleShellWideClass}
    >
      <ArcadeEmberBackdrop className="z-0 opacity-35" />
      {backdropExtra ? (
        <div className="pointer-events-none absolute inset-0 z-[1] opacity-20">{backdropExtra}</div>
      ) : null}

      <div className={`${arcadeTitleHeaderPanelClass} flex flex-col items-center gap-1 text-center`}>
        <p className={arcadeTitleEyebrowClass}>Good Vibes Club</p>
        <Image src="/gvc-logotype.svg" alt="Good Vibes Club" width={200} height={40} className="mx-auto opacity-95" />
        <h1 className={`${arcadeTitleHeadingClass} text-[clamp(2rem,8vw,2.75rem)] leading-none`}>{title}</h1>
        <p className={`${arcadeTitleTaglineClass} mx-auto max-w-sm`}>{tagline}</p>
        {headerExtra}
      </div>

      <div className="relative z-10 flex w-full items-center justify-between gap-2 px-1">
        {onBack ? (
          <button
            type="button"
            onClick={() => {
              c();
              onBack();
            }}
            className="rounded-lg border border-white/10 bg-black/80 px-2.5 py-1.5 font-display text-[10px] font-bold uppercase tracking-widest text-white/70 transition hover:border-gvc-gold/35 hover:text-gvc-gold"
          >
            ← Vibe Night
          </button>
        ) : (
          <span />
        )}
        <AccountButton muted={muted} />
      </div>

      {showShaka ? (
        <div className="relative">
          <Image
            src="/shaka.png"
            alt=""
            width={88}
            height={88}
            className="relative z-[1] mx-auto drop-shadow-[0_0_28px_rgba(255,224,72,0.45)] shaka-idle"
          />
        </div>
      ) : null}

      {rulesHint ? (
        <div className={`relative z-10 ${arcadeTitleSectionPanelClass}`}>
          <p className={`${arcadeRulesHintClass} mt-0`}>{rulesHint}</p>
        </div>
      ) : null}

      {children ? (
        heroInSection ? (
          <div className={`relative z-10 ${arcadeTitleSectionPanelClass}`}>{children}</div>
        ) : (
          <div className="relative z-10">{children}</div>
        )
      ) : null}

      <button
        type="button"
        onClick={() => {
          c();
          primaryCta.onClick();
        }}
        className={`relative z-[1] w-full ${arcadePrimaryCtaClass}`}
      >
        {primaryCta.label}
      </button>

      {secondaryGrid ? <div className="relative z-[1]">{secondaryGrid}</div> : null}

      {dailyCta ? (
        <button
          type="button"
          onClick={() => {
            c();
            dailyCta.onClick();
          }}
          className={`relative z-[1] w-full ${arcadeDailyCtaClass}`}
        >
          {dailyCta.label}
        </button>
      ) : null}

      {zenCta ? (
        <button
          type="button"
          onClick={() => {
            c();
            zenCta.onClick();
          }}
          className={`relative z-[1] w-full ${arcadeZenCtaClass}`}
        >
          {zenCta.label}
        </button>
      ) : null}

      {backgroundPicker ? (
        <div className={`relative z-[1] ${arcadeTitleSectionPanelClass}`}>{backgroundPicker}</div>
      ) : null}

      {footer}
    </motion.div>
  );
}
