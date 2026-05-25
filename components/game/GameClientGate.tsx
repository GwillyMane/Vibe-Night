"use client";

import { Component, type ErrorInfo, type ReactNode, useEffect, useRef, useState } from "react";
import type { ComponentType } from "react";
import type { VibeSlingGameProps } from "./VibeSlingGame";

const CHUNK_LOAD_ATTEMPTS = 4;
const CHUNK_RETRY_BASE_MS = 400;

function isLikelyChunkLoadFailure(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    /chunk/i.test(msg) ||
    /Loading CSS chunk/i.test(msg) ||
    /Loading chunk/i.test(msg) ||
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg) ||
    /error loading dynamically imported module/i.test(msg)
  );
}

async function importVibeSlingGame(): Promise<{ default: ComponentType<VibeSlingGameProps> }> {
  for (let attempt = 0; attempt < CHUNK_LOAD_ATTEMPTS; attempt++) {
    try {
      return await import(
        /* webpackChunkName: "vibe-sling-game", webpackPrefetch: true */ "./VibeSlingGame"
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
  throw new Error("importVibeSlingGame: unreachable");
}

function GameLoading({ slow }: { slow: boolean }) {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="font-display text-lg font-black uppercase tracking-wide text-gvc-gold text-shimmer">
        Loading Vibe Crashers
      </p>
      <p className="max-w-sm font-body text-sm text-white/50">
        Preparing the client bundle and physics engine.
      </p>
      {slow ? (
        <p className="max-w-md font-body text-xs leading-relaxed text-white/40">
          This is taking longer than usual — large first chunk or a slow network. Open DevTools → <strong>Network</strong>{" "}
          and look for red <span className="font-mono text-white/55">/_next/static/chunks/</span> rows (often{" "}
          <span className="font-mono text-white/55">404</span> or <span className="font-mono text-white/55">(blocked)</span>
          ). Then hard-refresh (<span className="font-mono text-white/55">Ctrl+Shift+R</span>). Locally: one dev server on
          the URL&apos;s port, then <span className="font-mono text-white/55">npm run dev:clean</span>.
        </p>
      ) : null}
    </div>
  );
}

class GameErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[Vibe Crashers] render error", error, info.componentStack);
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
            className="rounded-xl bg-gvc-gold px-5 py-2.5 font-display text-sm font-black uppercase text-gvc-black transition hover:opacity-95"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Loads the game with a plain dynamic `import()` after mount (avoids `next/dynamic` edge cases where the
 * loading UI never resolves). Surfaces chunk failures and long stalls in UI.
 */
export interface GameClientGateProps {
  /** When set, player can return to the arcade library home. */
  onExitToLibrary?: () => void;
}

export default function GameClientGate({ onExitToLibrary }: GameClientGateProps = {}) {
  const [Game, setGame] = useState<ComponentType<VibeSlingGameProps> | null>(null);
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

    /** Yield one frame so the loading UI can paint before the large game + Matter.js chunk parses. */
    const boot = window.setTimeout(() => {
      if (cancelled) return;

      slowTimer = window.setTimeout(() => {
        if (!cancelled && !loadedRef.current) setSlow(true);
      }, 6000);
      failTimer = window.setTimeout(() => {
        if (!cancelled && !loadedRef.current) {
          setLoadErr(
            "Timed out waiting for the game script (45s). Typical causes: two dev servers (browser on :3000 but Next on :3001), stale .next after a crash, or an ad-blocker stripping scripts. Fix: npm run dev:clean, open the exact URL the terminal prints, hard-refresh."
          );
        }
      }, 45000);

      importVibeSlingGame()
        .then((m) => {
          if (cancelled) return;
          loadedRef.current = true;
          setGame(() => m.default);
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          console.error("[Vibe Crashers] game chunk failed to load", err);
          const line = err instanceof Error ? err.message : String(err);
          const hint = isLikelyChunkLoadFailure(err)
            ? `${line}\n\nIf this repeats after “Try again”, do a full reload and run npm run dev:clean so HTML and chunks come from the same build.`
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
        <p className="font-display text-xl font-black uppercase text-gvc-gold">Could not load game</p>
        <p className="max-w-lg whitespace-pre-wrap font-body text-sm text-white/60">{loadErr}</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => {
              setLoadErr(null);
              setGame(null);
              setLoadAttemptKey((k) => k + 1);
            }}
            className="rounded-xl border border-gvc-gold/40 bg-black/50 px-5 py-2.5 font-display text-sm font-black uppercase text-gvc-gold transition hover:border-gvc-gold/70 hover:bg-black/70"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-xl bg-gvc-gold px-5 py-2.5 font-display text-sm font-black uppercase text-gvc-black transition hover:opacity-95"
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
    <GameErrorBoundary>
      <Game onExitToLibrary={onExitToLibrary} />
    </GameErrorBoundary>
  );
}
