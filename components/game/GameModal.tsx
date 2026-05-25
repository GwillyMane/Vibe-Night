"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { playUiClick } from "@/lib/sounds";
import {
  arcadeBackdropClass,
  arcadeCloseBtnClass,
  arcadeHeaderRow,
  arcadePanelClass,
  arcadeTitleClass,
} from "./gamePanelStyles";

export interface GameModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  muted: boolean;
  children: ReactNode;
  /** Taller sheet for long lists */
  tall?: boolean;
}

export function GameModal({ open, onClose, title, subtitle, muted, children, tall }: GameModalProps) {
  const close = () => {
    playUiClick(muted);
    onClose();
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className={`${arcadeBackdropClass} pointer-events-auto`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.button
            type="button"
            className="absolute inset-0 z-0 cursor-default bg-black/75 backdrop-blur-sm"
            aria-label="Close"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
          <motion.div
            initial={{ y: 48, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 36, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className={`relative z-10 w-full max-w-lg ${arcadePanelClass} ${tall ? "sm:max-h-[min(94dvh,900px)]" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="game-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={arcadeHeaderRow}>
              <div className="min-w-0 text-left">
                <h2 id="game-modal-title" className={arcadeTitleClass}>
                  {title}
                </h2>
                {subtitle ? <p className="mt-1 font-body text-xs text-white/45">{subtitle}</p> : null}
              </div>
              <button type="button" className={arcadeCloseBtnClass} onClick={close} aria-label="Close panel">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[min(70dvh,560px)] overflow-y-auto overscroll-contain pr-0.5">{children}</div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
