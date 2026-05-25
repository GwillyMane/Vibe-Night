"use client";

import { useState } from "react";
import Link from "next/link";
import { LogIn, LogOut, User } from "lucide-react";
import { playUiClick } from "@/lib/sounds";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "./AuthModal";

export function AccountButton({ muted }: { muted: boolean }) {
  const { user, loading, logout } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="h-10 w-24 animate-pulse rounded-xl border border-white/10 bg-black/40" aria-hidden />
    );
  }

  if (!user) {
    return (
      <>
        <button
          type="button"
          onClick={() => {
            playUiClick(muted);
            setAuthOpen(true);
          }}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-gvc-gold/35 bg-black/50 px-4 py-2 font-display text-xs font-bold uppercase tracking-wide text-gvc-gold transition hover:border-gvc-gold/60"
        >
          <LogIn className="h-4 w-4" />
          Sign in
        </button>
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} muted={muted} />
      </>
    );
  }

  return (
    <>
      <div className="relative">
        <Link
          href={`/profile/${encodeURIComponent(user.username)}`}
          onClick={() => playUiClick(muted)}
          className="inline-flex min-h-[44px] max-w-[200px] items-center gap-2 rounded-xl border border-white/12 bg-black/50 px-3 py-2 font-display text-xs font-bold uppercase tracking-wide text-white transition hover:border-gvc-gold/35"
        >
          <User className="h-4 w-4 shrink-0 text-gvc-gold" />
          <span className="truncate">{user.username}</span>
        </Link>
        <button
          type="button"
          onClick={() => {
            playUiClick(muted);
            setMenuOpen((o) => !o);
          }}
          className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border border-white/15 bg-black/80 text-white/60"
          aria-label="Account menu"
        >
          ···
        </button>
        {menuOpen ? (
          <>
            <button type="button" className="fixed inset-0 z-[94] cursor-default" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full z-[96] mt-1 min-w-[180px] rounded-xl border border-gvc-gold/25 bg-[#0c0c0c] py-1 shadow-xl">
              <Link
                href={`/profile/${encodeURIComponent(user.username)}`}
                className="flex w-full items-center gap-2 px-3 py-2.5 font-body text-sm text-white/80 hover:bg-white/5"
                onClick={() => {
                  playUiClick(muted);
                  setMenuOpen(false);
                }}
              >
                View passport
              </Link>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2.5 font-body text-sm text-white/80 hover:bg-white/5"
                onClick={async () => {
                  playUiClick(muted);
                  setMenuOpen(false);
                  await logout();
                }}
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
