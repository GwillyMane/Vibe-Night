"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogIn, LogOut, User, UserPlus } from "lucide-react";
import { playUiClick } from "@/lib/sounds";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal, type AuthModalTab } from "@/components/game/AuthModal";

/**
 * Log in / sign up controls for the Vibe Night library home.
 */
export function NightAccountBar() {
  const [muted, setMuted] = useState(false);
  useEffect(() => {
    setMuted(localStorage.getItem("sound-muted") === "1");
  }, []);

  const { user, loading, logout } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<AuthModalTab>("login");
  const [menuOpen, setMenuOpen] = useState(false);

  const openAuth = (tab: AuthModalTab) => {
    playUiClick(muted);
    setAuthTab(tab);
    setAuthOpen(true);
  };

  if (loading) {
    return (
      <div className="flex gap-2">
        <div className="h-10 w-20 animate-pulse rounded-xl border border-white/10 bg-black/40" aria-hidden />
        <div className="h-10 w-24 animate-pulse rounded-xl border border-white/10 bg-black/40" aria-hidden />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => openAuth("login")}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/12 bg-black/50 px-4 py-2 font-display text-xs font-bold uppercase tracking-wide text-white/85 transition hover:border-gvc-gold/35 hover:text-gvc-gold"
          >
            <LogIn className="h-4 w-4" />
            Log in
          </button>
          <button
            type="button"
            onClick={() => openAuth("register")}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-gvc-gold/35 bg-gvc-gold/10 px-4 py-2 font-display text-xs font-bold uppercase tracking-wide text-gvc-gold transition hover:border-gvc-gold/55 hover:bg-gvc-gold/15"
          >
            <UserPlus className="h-4 w-4" />
            Sign up
          </button>
        </div>
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} muted={muted} initialTab={authTab} />
      </>
    );
  }

  return (
    <>
      <div className="relative">
        <Link
          href={`/profile/${encodeURIComponent(user.username)}`}
          onClick={() => playUiClick(muted)}
          className="inline-flex min-h-[44px] max-w-[220px] items-center gap-2 rounded-xl border border-gvc-gold/30 bg-gvc-gold/10 px-4 py-2 font-display text-xs font-bold uppercase tracking-wide text-gvc-gold transition hover:border-gvc-gold/50"
        >
          <User className="h-4 w-4 shrink-0" />
          <span className="truncate">{user.username}</span>
        </Link>
        <button
          type="button"
          onClick={() => {
            playUiClick(muted);
            setMenuOpen((o) => !o);
          }}
          className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border border-gvc-gold/30 bg-black/80 text-gvc-gold/70"
          aria-label="Account menu"
        >
          ···
        </button>
        {menuOpen ? (
          <>
            <button type="button" className="fixed inset-0 z-[94] cursor-default" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full z-[96] mt-1 min-w-[200px] rounded-xl border border-gvc-gold/25 bg-[#0c0c0c] py-1 shadow-xl">
              <p className="border-b border-white/[0.06] px-3 py-2 font-body text-[10px] uppercase tracking-widest text-white/40">
                Signed in
              </p>
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
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} muted={muted} initialTab={authTab} />
    </>
  );
}
