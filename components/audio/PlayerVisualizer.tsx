"use client";

export function PlayerVisualizer({ playing, reducedMotion }: { playing: boolean; reducedMotion?: boolean }) {
  const bars = [
    { h: "h-1.5", delay: "0ms" },
    { h: "h-3", delay: "120ms" },
    { h: "h-2", delay: "240ms" },
  ];
  const animate = playing && !reducedMotion;
  return (
    <div className="flex h-4 items-end gap-[3px]" aria-hidden>
      {bars.map((b, i) => (
        <span
          key={i}
          className={`w-[3px] rounded-full bg-gvc-gold/70 ${b.h} ${animate ? "origin-bottom animate-[musicBar_0.85s_ease-in-out_infinite_alternate]" : ""}`}
          style={animate ? { animationDelay: b.delay } : undefined}
        />
      ))}
    </div>
  );
}
