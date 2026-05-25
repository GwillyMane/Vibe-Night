/** Threat tiers, score multipliers, and escalation helpers for Vibe Garden. */

export type ThreatLevel = "calm" | "watch" | "danger" | "critical";

export const THREAT_LABEL: Record<ThreatLevel, string> = {
  calm: "Calm",
  watch: "Watch",
  danger: "Danger",
  critical: "Critical",
};

export function threatLevel(corruption: number, stability: number): ThreatLevel {
  if (corruption >= 82 || stability <= 22) return "critical";
  if (corruption >= 52 || stability <= 42) return "danger";
  if (corruption >= 28 || stability <= 68) return "watch";
  return "calm";
}

/** 1.0 at start → ~2.1 by 2 minutes — corruption pressure ramps over a run. */
export function pressureMult(elapsedMs: number): number {
  return 1 + Math.min(1.1, elapsedMs / 110_000);
}

/** Risk/reward: bigger bloom score when corruption is high (but survival ticks stop). */
export function riskScoreMultiplier(corruption: number): number {
  if (corruption < 20) return 1;
  return 1 + Math.min(0.85, (corruption - 20) / 94);
}

/** Passive survival points — only while garden is relatively healthy. */
export function survivalScorePerSec(corruption: number, stability: number): number {
  if (corruption >= 45 || stability <= 35) return 0;
  const purity = (45 - corruption) / 45;
  const stab = stability / 100;
  return Math.max(0, Math.round(1 + purity * 2 * stab));
}
