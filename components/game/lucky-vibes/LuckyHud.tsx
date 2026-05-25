"use client";

import { motion } from "framer-motion";

import { streakMultiplier } from "@/lib/lucky-vibes/luckyConfig";

export function LuckyHud({
  score,
  spinsLeft,
  maxSpins,
  streak,
  luckySpinsLeft,
  multiplier,
  vibeLockRespins,
  mode,
  spinning,
}: {
  score: number;
  spinsLeft: number;
  maxSpins: number;
  streak: number;
  luckySpinsLeft?: number | null;
  multiplier?: number | null;
  vibeLockRespins?: number | null;
  mode: "classic" | "daily" | "zen";
  spinning?: boolean;
}) {
  const streakMult = streakMultiplier(streak);
  const spinsLabel = mode === "zen" ? "∞" : `${spinsLeft}`;

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col gap-2 px-1">
      <div className="flex items-stretch justify-between gap-2">
        <motion.div
          layout
          className="min-w-[88px] rounded-xl border border-gvc-gold/25 bg-gradient-to-br from-[#121212] to-[#0a0a0e] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,224,72,0.08)]"
        >
          <p className="font-body text-[9px] uppercase tracking-[0.2em] text-white/40">Score</p>
          <motion.p
            key={score}
            initial={{ scale: 1.08, color: "#fff" }}
            animate={{ scale: 1, color: "#FFE048" }}
            className="font-display text-xl font-black tabular-nums text-gvc-gold"
          >
            {score.toLocaleString()}
          </motion.p>
        </motion.div>

        {luckySpinsLeft != null && luckySpinsLeft > 0 ? (
          <motion.div
            animate={{ boxShadow: ["0 0 12px rgba(255,107,157,0.2)", "0 0 24px rgba(255,107,157,0.45)", "0 0 12px rgba(255,107,157,0.2)"] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
            className="rounded-xl border border-pink-400/40 bg-pink-500/10 px-3 py-2 text-center"
          >
            <p className="font-display text-[9px] font-bold uppercase tracking-widest text-pink-300">Lucky Spins</p>
            <p className="font-display text-lg font-black text-white">{luckySpinsLeft}</p>
          </motion.div>
        ) : null}

        {multiplier != null && multiplier > 1 ? (
          <div className="rounded-xl border border-gvc-gold/50 bg-gvc-gold/10 px-3 py-2 text-center">
            <p className="font-display text-[9px] font-bold uppercase tracking-widest text-gvc-gold/80">Mult</p>
            <p className="font-display text-lg font-black text-gvc-gold">×{multiplier}</p>
          </div>
        ) : null}

        {vibeLockRespins != null ? (
          <div className="rounded-xl border border-blue-400/40 bg-blue-500/10 px-3 py-2 text-center">
            <p className="font-display text-[9px] font-bold uppercase tracking-widest text-blue-300">Respins</p>
            <p className="font-display text-lg font-black text-white">{vibeLockRespins}</p>
          </div>
        ) : null}

        <div className="min-w-[88px] rounded-xl border border-white/10 bg-gradient-to-br from-[#121212] to-[#0a0a0e] px-3 py-2 text-right">
          <p className="font-body text-[9px] uppercase tracking-[0.2em] text-white/40">Spins</p>
          <p className="font-display text-xl font-black tabular-nums text-white">
            {spinsLabel}
            {mode !== "zen" ? <span className="text-sm text-white/35"> / {maxSpins}</span> : null}
          </p>
        </div>
      </div>

      {streakMult > 1 ? (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center font-display text-xs font-bold uppercase tracking-[0.25em] text-orange-400"
        >
          Streak ×{streakMult}
        </motion.p>
      ) : null}

      {spinning ? (
        <motion.div
          className="mx-auto h-0.5 w-24 overflow-hidden rounded-full bg-white/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="h-full bg-gvc-gold"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
            style={{ width: "50%" }}
          />
        </motion.div>
      ) : null}
    </div>
  );
}

export function LuckySpinButton({
  disabled,
  onClick,
  label,
}: {
  disabled?: boolean;
  onClick: () => void;
  label?: string;
}) {
  return (
    <div className="relative flex flex-col items-center gap-1">
      <motion.div
        className="pointer-events-none absolute inset-0 -m-3 rounded-full bg-gvc-gold/20 blur-xl"
        animate={disabled ? { opacity: 0.2, scale: 0.9 } : { opacity: [0.35, 0.55, 0.35], scale: [1, 1.06, 1] }}
        transition={{ repeat: disabled ? 0 : Infinity, duration: 2 }}
      />
      <motion.button
        type="button"
        disabled={disabled}
        onClick={onClick}
        whileHover={disabled ? undefined : { scale: 1.06 }}
        whileTap={disabled ? undefined : { scale: 0.94 }}
        className="relative flex h-[76px] w-[76px] items-center justify-center rounded-full border-2 border-gvc-gold/60 bg-gradient-to-b from-[#FFE048] to-[#E8C030] font-display text-sm font-black uppercase tracking-wider text-gvc-black shadow-[0_0_40px_rgba(255,224,72,0.4),inset_0_2px_0_rgba(255,255,255,0.35)] transition disabled:opacity-40 disabled:shadow-none"
      >
        {label ?? "Spin"}
      </motion.button>
      <p className="font-body text-[10px] uppercase tracking-[0.2em] text-white/30">Tap to play</p>
    </div>
  );
}
