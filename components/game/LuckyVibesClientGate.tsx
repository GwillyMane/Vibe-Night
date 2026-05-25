"use client";

import { Component, type ErrorInfo, type ReactNode, useEffect, useRef, useState } from "react";
import type { ComponentType } from "react";
import type { LuckyVibesGameProps } from "./lucky-vibes/LuckyVibesGame";

const CHUNK_LOAD_ATTEMPTS = 4;
const CHUNK_RETRY_BASE_MS = 400;
const PRODUCT_TITLE_FALLBACK = "Lucky Vibes";

async function importLuckyVibesGame(): Promise<{ default: ComponentType<LuckyVibesGameProps> }> {
  for (let attempt = 0; attempt < CHUNK_LOAD_ATTEMPTS; attempt++) {
    try {
      return await import(
        /* webpackChunkName: "lucky-vibes-game", webpackPrefetch: true */ "./lucky-vibes/LuckyVibesGame"
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const retry =
        /chunk|Loading CSS chunk|Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|reading 'call'|Cannot read properties of undefined/i.test(
          msg
        );
      if (attempt < CHUNK_LOAD_ATTEMPTS - 1 && retry) {
        await new Promise((r) => setTimeout(r, CHUNK_RETRY_BASE_MS * Math.pow(2, attempt)));
        continue;
      }
      throw e;
    }
  }
  throw new Error("importLuckyVibesGame: unreachable");
}

function GameLoading({ slow }: { slow: boolean }) {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="font-display text-lg font-black uppercase tracking-wide text-gvc-gold text-shimmer">
        Loading {PRODUCT_TITLE_FALLBACK}
      </p>
      <p className="max-w-sm font-body text-sm text-white/50">Preparing reels and GVC symbols.</p>
      {slow ? (
        <p className="max-w-md font-body text-xs leading-relaxed text-white/40">
          Taking longer than usual — hard-refresh or run npm run dev:clean.
        </p>
      ) : null}
    </div>
  );
}

class LuckyErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[Lucky Vibes] render error", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 px-4 text-center">
          <p className="font-display text-xl font-black uppercase text-gvc-gold">Reels glitched</p>
          <p className="max-w-md font-body text-sm text-white/60">{this.state.error.message}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-xl bg-gvc-gold px-5 py-2.5 font-display text-sm font-black uppercase text-gvc-black"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export interface LuckyVibesClientGateProps {
  onExitToLibrary?: () => void;
}

export default function LuckyVibesClientGate({ onExitToLibrary }: LuckyVibesClientGateProps) {
  const [Game, setGame] = useState<ComponentType<LuckyVibesGameProps> | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [slow, setSlow] = useState(false);
  const [loadAttemptKey, setLoadAttemptKey] = useState(0);
  const loadedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let slowTimer: number | undefined;
    let failTimer: number | undefined;
    loadedRef.current = false;
    setSlow(false);
    setLoadErr(null);

    const boot = window.setTimeout(() => {
      slowTimer = window.setTimeout(() => {
        if (!cancelled && !loadedRef.current) setSlow(true);
      }, 6000);
      failTimer = window.setTimeout(() => {
        if (!cancelled && !loadedRef.current) setLoadErr("Timed out loading Lucky Vibes (45s).");
      }, 45000);

      importLuckyVibesGame()
        .then((m) => {
          if (cancelled) return;
          if (!m?.default) throw new Error("Lucky Vibes module missing default export.");
          loadedRef.current = true;
          setGame(() => m.default);
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          setLoadErr(err instanceof Error ? err.message : String(err));
        })
        .finally(() => {
          if (slowTimer !== undefined) window.clearTimeout(slowTimer);
          if (failTimer !== undefined) window.clearTimeout(failTimer);
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(boot);
      if (slowTimer !== undefined) window.clearTimeout(slowTimer);
      if (failTimer !== undefined) window.clearTimeout(failTimer);
    };
  }, [loadAttemptKey]);

  if (loadErr) {
    return (
      <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="font-display text-xl font-black uppercase text-gvc-gold">Could not load {PRODUCT_TITLE_FALLBACK}</p>
        <p className="max-w-lg whitespace-pre-wrap font-body text-sm text-white/60">{loadErr}</p>
        <button
          type="button"
          onClick={() => {
            setLoadErr(null);
            setGame(null);
            setLoadAttemptKey((k) => k + 1);
          }}
          className="rounded-xl border border-gvc-gold/40 px-5 py-2.5 font-display text-sm font-black uppercase text-gvc-gold"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!Game) return <GameLoading slow={slow} />;

  return (
    <LuckyErrorBoundary>
      <Game onExitToLibrary={onExitToLibrary} />
    </LuckyErrorBoundary>
  );
}
