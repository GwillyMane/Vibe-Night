"use client";

export function LeaderboardSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <ul className="space-y-2" aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <li
          key={i}
          className="flex animate-pulse items-center justify-between gap-2 rounded-lg border border-white/8 bg-black/40 px-3 py-2"
        >
          <span className="h-4 w-8 rounded bg-white/10" />
          <span className="h-4 min-w-0 flex-1 rounded bg-white/10" />
          <span className="h-4 w-16 rounded bg-white/10" />
        </li>
      ))}
    </ul>
  );
}
