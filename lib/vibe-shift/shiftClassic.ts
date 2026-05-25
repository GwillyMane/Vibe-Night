import { todaySeed } from "@/lib/daily-seed";
import { getLevelTarget } from "./shiftLevels";

export function classicLevelProgress(score: number, level: number): { target: number; pct: number } {
  const target = getLevelTarget(level);
  const prevTarget = level > 1 ? getLevelTarget(level - 1) : 0;
  const span = target - prevTarget;
  const pct = span > 0 ? Math.min(100, Math.round(((score - prevTarget) / span) * 100)) : 100;
  return { target, pct: Math.max(0, pct) };
}

export function shiftDailySeed(): string {
  return todaySeed();
}

export function shiftRunSeed(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `run-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
