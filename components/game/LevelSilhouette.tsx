/** Tiny level silhouette from target/block counts for level select. */
export function LevelSilhouette({
  targetCount,
  blockCount,
}: {
  targetCount: number;
  blockCount: number;
}) {
  const targets = Math.min(5, Math.max(1, targetCount));
  const blocks = Math.min(8, Math.max(2, Math.floor(blockCount / 4)));

  return (
    <svg viewBox="0 0 48 40" className="h-10 w-12 shrink-0 opacity-70" aria-hidden>
      <rect x="4" y="32" width="40" height="4" rx="1" fill="rgba(255,255,255,0.12)" />
      {Array.from({ length: blocks }).map((_, i) => {
        const col = i % 4;
        const row = Math.floor(i / 4);
        return (
          <rect
            key={`b-${i}`}
            x={8 + col * 9}
            y={24 - row * 7}
            width={7}
            height={6}
            rx={1}
            fill="rgba(255,224,72,0.25)"
          />
        );
      })}
      {Array.from({ length: targets }).map((_, i) => (
        <circle
          key={`t-${i}`}
          cx={12 + i * 8}
          cy={10 + (i % 2) * 4}
          r={3.5}
          fill="rgba(255,107,157,0.55)"
        />
      ))}
    </svg>
  );
}
