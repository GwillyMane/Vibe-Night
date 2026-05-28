"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type DebugPayload = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    __VIBE_DEBUG__?: DebugPayload;
  }
}

/** Floating debug panel when `?debug=1` — games set `window.__VIBE_DEBUG__` each frame/tick. */
export function ArcadeDebugOverlay() {
  const params = useSearchParams();
  const enabled = params.get("debug") === "1";
  const [data, setData] = useState<DebugPayload>({});
  const [fps, setFps] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let frames = 0;
    let last = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      frames += 1;
      if (now - last >= 500) {
        setFps(Math.round((frames * 1000) / (now - last)));
        frames = 0;
        last = now;
        setData({ ...(window.__VIBE_DEBUG__ ?? {}) });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enabled]);

  if (!enabled) return null;

  const rows = Object.entries(data);

  return (
    <div className="pointer-events-none fixed left-2 top-[max(0.5rem,env(safe-area-inset-top))] z-[120] max-w-[min(92vw,280px)] rounded-xl border border-gvc-gold/30 bg-black/90 px-3 py-2 font-mono text-[10px] text-gvc-gold shadow-lg">
      <p className="font-display text-[9px] font-bold uppercase tracking-widest text-white/50">Debug</p>
      <p>FPS {fps}</p>
      {rows.map(([k, v]) => (
        <p key={k} className="truncate text-white/80">
          {k}: {String(v)}
        </p>
      ))}
    </div>
  );
}
