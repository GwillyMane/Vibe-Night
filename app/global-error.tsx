"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 bg-[#050505] px-6 text-center font-body text-white">
        <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-[#FFE048]/70">Vibe Night</p>
        <h1 className="font-display text-2xl font-black uppercase text-[#FFE048]">Something broke</h1>
        <p className="max-w-md text-sm text-white/60">
          The hub hit an unexpected error. Refresh to try again — your local progress is still on this device.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-xl bg-[#FFE048] px-6 py-3 font-display text-sm font-black uppercase text-[#050505] transition hover:brightness-105"
        >
          Restart
        </button>
      </body>
    </html>
  );
}
