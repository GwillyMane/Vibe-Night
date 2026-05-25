"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { GameId } from "@/lib/games/catalog";
import { COACH_STEPS, markOnboardingComplete, type CoachStep } from "@/lib/arcade/onboarding";
import { playUiClick } from "@/lib/sounds";

export function FirstRunCoachOverlay({
  gameId,
  open,
  muted,
  onComplete,
}: {
  gameId: GameId | "vibe-crashers";
  open: boolean;
  muted: boolean;
  onComplete: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const steps = COACH_STEPS[gameId];
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (open) setStepIndex(0);
  }, [open]);

  if (!open) return null;

  const step = steps[stepIndex];
  const isLast = stepIndex >= steps.length - 1;

  const finish = () => {
    markOnboardingComplete(gameId);
    onComplete();
  };

  const next = () => {
    playUiClick(muted);
    if (isLast) finish();
    else setStepIndex((i) => i + 1);
  };

  const skip = () => {
    playUiClick(muted);
    finish();
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-end justify-center rounded-2xl p-3 sm:items-center sm:p-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={stepIndex}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className="pointer-events-auto w-full max-w-sm rounded-2xl border border-gvc-gold/35 bg-[#0a0a0a]/92 px-4 py-4 shadow-[0_0_48px_rgba(255,224,72,0.15)] backdrop-blur-md"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="font-display text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">
              Quick tips · {stepIndex + 1}/{steps.length}
            </p>
            <button
              type="button"
              onClick={skip}
              className="font-display text-[9px] font-bold uppercase tracking-wide text-white/45 hover:text-gvc-gold"
            >
              Skip
            </button>
          </div>
          <CoachStepView step={step} />
          <div className="mt-3 flex gap-1">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${i <= stepIndex ? "bg-gvc-gold" : "bg-white/10"}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={next}
            className="mt-4 min-h-[44px] w-full rounded-xl bg-gvc-gold font-display text-xs font-black uppercase text-gvc-black"
          >
            {isLast ? "Got it — let's play!" : "Next tip"}
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function CoachStepView({ step }: { step: CoachStep }) {
  return (
    <div className="text-center">
      {step.emoji ? <p className="text-3xl">{step.emoji}</p> : null}
      <h3 className="mt-1 font-display text-lg font-black uppercase text-shimmer">{step.title}</h3>
      <p className="mt-2 font-body text-sm leading-relaxed text-white/65">{step.body}</p>
    </div>
  );
}
