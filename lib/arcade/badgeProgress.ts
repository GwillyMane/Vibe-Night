import type { BadgeRow } from "./badgeTypes";

/** Keep progress display aligned with unlocked state. */
export function finalizeBadgeRow(row: BadgeRow): BadgeRow {
  const current = row.unlocked ? row.target : Math.min(Math.max(0, row.current), row.target);
  return { ...row, current };
}

export function finalizeBadgeRows(rows: BadgeRow[]): BadgeRow[] {
  return rows.map(finalizeBadgeRow);
}
