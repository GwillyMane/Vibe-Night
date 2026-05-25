"use client";

import { Component, type ErrorInfo, type ReactNode, useEffect, useRef, useState } from "react";
import type { ComponentType } from "react";
import type { VibeMergeGameProps } from "./vibe-merge/VibeMergeGame";

const CHUNK_LOAD_ATTEMPTS = 4;
const CHUNK_RETRY_BASE_MS = 400;
const PRODUCT_TITLE_FALLBACK = "Big Vibes";

function isLikelyChunkLoadFailure(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    /chunk/i.test(msg) ||
    /Loading CSS chunk/i.test(msg) ||
    /Loading chunk/i.test(msg) ||
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg) ||
    /error loading dynamically imported module/i.test(msg) ||
    /reading 'call'/i.test(msg) ||
    /Cannot read properties of undefined/i.test(msg)
  );
}

async function importVibeMergeGame(): Promise<{ default: ComponentType<VibeMergeGameProps> }> {
  for (let attempt = 0; attempt < CHUNK_LOAD_ATTEMPTS; attempt++) {
    try {
      return await import(
        /* webpackChunkName: "big-vibes-game", webpackPrefetch: true */ "./vibe-merge/VibeMergeGame"
      );
    } catch (e) {
      if (attempt < CHUNK_LOAD_ATTEMPTS - 1 && isLikelyChunkLoadFailure(e)) {
        const wait = CHUNK_RETRY_BASE_MS * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      throw e;
    }
  }
  throw new Error("importVibeMergeGame: unreachable");
}

function GameLoading({ slow }: { slow: boolean }) {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="font-display text-lg font-black uppercase tracking-wide text-gvc-gold text-shimmer">
        Loading {PRODUCT_TITLE_FALLBACK}
      </p>
      <p className="max-w-sm font-body text-sm text-white/50">Preparing merge physics and assets.</p>
      {slow ? (
        <p className="max-w-md font-body text-xs leading-relaxed text-white/40">
          Taking longer than usual — hard-refresh (<span className="font-mono text-white/55">Ctrl+Shift+R</span>) or run{" "}
          <span className="font-mono text-white/55">npm run dev:clean</span>.
        </p>
      ) : null}
    </div>
  );
}

class MergeErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[Big Vibes] render error", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 px-4 text-center">
          <p className="font-display text-xl font-black uppercase text-gvc-gold">Something went off-kilter</p>
          <p className="max-w-md font-body text-sm text-white/60">{this.state.error.message}</p>
          <button
            type="button"
            onClick={() => {
              this.setState({ error: null });
              if (typeof window !== "undefined") window.location.reload();
            }}
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

export interface VibeMergeClientGateProps {
  onExitToLibrary?: () => void;
}

export default function VibeMergeClientGate({ onExitToLibrary }: VibeMergeClientGateProps) {
  const [Game, setGame] = useState<ComponentType<VibeMergeGameProps> | null>(null);
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
      if (cancelled) return;

      slowTimer = window.setTimeout(() => {
        if (!cancelled && !loadedRef.current) setSlow(true);
      }, 6000);
      failTimer = window.setTimeout(() => {
        if (!cancelled && !loadedRef.current) {
          setLoadErr(
            "Timed out loading Big Vibes (45s). Run npm run dev:clean, open the URL the terminal prints, then hard-refresh."
          );
        }
      }, 45000);

      importVibeMergeGame()
        .then((m) => {
          if (cancelled) return;
          if (!m?.default) {
            throw new Error("Big Vibes module loaded but default export is missing.");
          }
          loadedRef.current = true;
          setGame(() => m.default);
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          console.error("[Big Vibes] game chunk failed to load", err);
          const line = err instanceof Error ? err.message : String(err);
          const hint = isLikelyChunkLoadFailure(err)
            ? `${line}\n\nStale webpack chunk — run npm run dev:clean and hard-refresh.`
            : line;
          setLoadErr(hint);
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
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => {
              setLoadErr(null);
              setGame(null);
              setLoadAttemptKey((k) => k + 1);
            }}
            className="rounded-xl border border-gvc-gold/40 bg-black/50 px-5 py-2.5 font-display text-sm font-black uppercase text-gvc-gold"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-xl bg-gvc-gold px-5 py-2.5 font-display text-sm font-black uppercase text-gvc-black"
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }

  if (!Game) {
    return <GameLoading slow={slow} />;
  }

  return (
    <MergeErrorBoundary>
      <Game onExitToLibrary={onExitToLibrary} />
    </MergeErrorBoundary>
  );
}
