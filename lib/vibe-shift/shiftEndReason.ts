export type ShiftEndReason =
  | "classic_complete"
  | "gridlock"
  | "daily_moves_exhausted"
  | "quit";

export const SHIFT_RULES_HINT =
  "Drag a row or column to shift faces. Match 3+ in a row/column, 4+ for bonus lines, or 2×2 squares. Every shift counts as a move.";

export function endReasonLabel(reason: ShiftEndReason | null): string {
  switch (reason) {
    case "classic_complete":
      return "All 10 levels cleared!";
    case "gridlock":
      return "No legal moves left.";
    case "daily_moves_exhausted":
      return "Move budget used up.";
    case "quit":
      return "Run ended.";
    default:
      return "";
  }
}

export function isWinReason(reason: ShiftEndReason | null, mode: "classic" | "daily"): boolean {
  if (mode === "classic") return reason === "classic_complete";
  return false;
}
