"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function Error({
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
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h2 className="font-display text-lg font-black uppercase text-[#FFE048]">Something broke</h2>
      <p className="max-w-md text-sm text-white/60">This section hit an unexpected error.</p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-xl bg-[#FFE048] px-5 py-2.5 font-display text-xs font-black uppercase text-[#050505]"
      >
        Try again
      </button>
    </div>
  );
}
