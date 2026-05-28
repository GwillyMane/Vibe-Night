"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { VIBE_NIGHT } from "@/lib/brand";

const BACK_LINK_CLASS =
  "fixed left-3 top-[max(0.75rem,env(safe-area-inset-top))] z-[60] rounded-xl border border-gvc-gold/35 bg-black/75 px-3 py-2 font-display text-[10px] font-bold uppercase tracking-widest text-gvc-gold shadow-lg backdrop-blur-md transition hover:border-gvc-gold/60 hover:bg-black/90 sm:left-4 sm:text-xs";

export function useExitToLibrary(): () => void {
  const router = useRouter();
  return () => router.push("/");
}

export function GameRouteShell({
  children,
  showBackLink = true,
}: {
  children: ReactNode;
  showBackLink?: boolean;
}) {
  return (
    <main className="relative min-h-[100dvh]">
      {showBackLink ? (
        <Link href="/" className={BACK_LINK_CLASS}>
          ← {VIBE_NIGHT.shortName}
        </Link>
      ) : null}
      {children}
    </main>
  );
}
