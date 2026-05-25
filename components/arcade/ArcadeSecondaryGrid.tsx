"use client";

import { arcadeSecondaryBtnClass } from "@/components/game/gamePanelStyles";
import { playUiClick } from "@/lib/sounds";

export interface ArcadeSecondaryAction {
  label: string;
  onClick: () => void;
}

export function ArcadeSecondaryGrid({
  actions,
  muted,
  columns = 2,
}: {
  actions: ArcadeSecondaryAction[];
  muted: boolean;
  columns?: 2 | 3 | 4;
}) {
  const gridClass =
    columns === 4
      ? "grid grid-cols-2 gap-2 sm:grid-cols-4"
      : columns === 3
        ? "grid grid-cols-3 gap-2"
        : "grid grid-cols-2 gap-2";

  return (
    <div className={`relative ${gridClass}`}>
      {actions.map((a) => (
        <button
          key={a.label}
          type="button"
          className={arcadeSecondaryBtnClass}
          onClick={() => {
            playUiClick(muted);
            a.onClick();
          }}
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}
