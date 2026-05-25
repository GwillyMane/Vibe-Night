/** Shared daily challenge copy across the arcade. */
export function dailyHudLabel(seed: string): string {
  return seed ? `Today's daily · ${seed}` : "Today's daily";
}

export function dailyCardLabel(): string {
  return "Today's daily";
}
