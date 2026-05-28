"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export function ArcadeEmptyState({
  headline,
  detail,
  actionLabel,
  actionHref,
  onAction,
}: {
  headline: string;
  detail?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}) {
  let action: ReactNode = null;
  if (actionLabel && actionHref) {
    action = (
      <Link
        href={actionHref}
        className="mt-3 inline-block rounded-xl border border-gvc-gold/35 bg-gvc-gold/10 px-4 py-2 font-display text-[10px] font-bold uppercase tracking-widest text-gvc-gold transition hover:bg-gvc-gold/20"
      >
        {actionLabel}
      </Link>
    );
  } else if (actionLabel && onAction) {
    action = (
      <button
        type="button"
        onClick={onAction}
        className="mt-3 rounded-xl border border-gvc-gold/35 bg-gvc-gold/10 px-4 py-2 font-display text-[10px] font-bold uppercase tracking-widest text-gvc-gold transition hover:bg-gvc-gold/20"
      >
        {actionLabel}
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-white/8 bg-black/40 px-4 py-6 text-center">
      <p className="font-display text-sm font-bold uppercase tracking-wide text-white/70">{headline}</p>
      {detail ? <p className="mt-2 font-body text-xs text-white/45">{detail}</p> : null}
      {action}
    </div>
  );
}
