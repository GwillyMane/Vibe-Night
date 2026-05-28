"use client";

import { useEffect, useId, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, X } from "lucide-react";
import { playUiClick } from "@/lib/sounds";
import { useAuth } from "@/hooks/useAuth";
import { VIBE_NIGHT } from "@/lib/brand";
import { ArcadeOverlayPortal } from "@/components/arcade/ArcadeOverlayPortal";
import {
  arcadeBackdropClass,
  arcadeCloseBtnClass,
  arcadeHeaderRow,
  arcadePanelClass,
  arcadeTitleClass,
  arcadeTabBtn,
  arcadeTabRow,
} from "./gamePanelStyles";

export type AuthModalTab = "login" | "register";

export function AuthModal({
  open,
  onClose,
  muted,
  initialTab = "login",
  title = VIBE_NIGHT.shortName,
  subtitle = "One account for every game — progress and leaderboards sync when you sign in.",
}: {
  open: boolean;
  onClose: () => void;
  muted: boolean;
  initialTab?: AuthModalTab;
  title?: string;
  subtitle?: string;
}) {
  const { login, register, dbConfigured } = useAuth();
  const [tab, setTab] = useState<AuthModalTab>(initialTab);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [loginId, setLoginId] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [regUser, setRegUser] = useState("");
  const [regPw, setRegPw] = useState("");

  const loginPanelId = useId();
  const registerPanelId = useId();
  const accountsTitleId = useId();

  const resetForm = () => {
    setTab("login");
    setErr(null);
    setLoading(false);
    setLoginId("");
    setLoginPw("");
    setRegUser("");
    setRegPw("");
  };

  useEffect(() => {
    if (open) {
      setTab(initialTab);
      setErr(null);
    } else {
      resetForm();
    }
  }, [open, initialTab]);

  const close = () => {
    playUiClick(muted);
    resetForm();
    onClose();
  };

  if (!dbConfigured) {
    return (
      <ArcadeOverlayPortal>
        <AnimatePresence>
          {open ? (
            <div className={`${arcadeBackdropClass} pointer-events-auto`} onClick={close}>
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 30, opacity: 0 }}
                className={`relative z-10 w-full max-w-lg ${arcadePanelClass}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby={accountsTitleId}
                onClick={(ev) => ev.stopPropagation()}
              >
                <div className={arcadeHeaderRow}>
                  <h2 id={accountsTitleId} className={arcadeTitleClass}>
                    Accounts
                  </h2>
                  <button type="button" className={arcadeCloseBtnClass} onClick={close} aria-label="Close">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <p className="font-body text-sm text-white/60">
                  Cloud accounts need a database. Set <span className="font-mono text-gvc-gold/90">DATABASE_URL</span> on the
                  server — you can still play as a guest locally.
                </p>
              </motion.div>
            </div>
          ) : null}
        </AnimatePresence>
      </ArcadeOverlayPortal>
    );
  }

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const result = await login(loginId, loginPw);
      if (result.ok) {
        close();
      } else {
        setErr(result.error);
      }
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (regPw.length < 8) {
      setErr("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const result = await register(regUser, regPw);
      if (result.ok) {
        close();
      } else {
        setErr(result.error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ArcadeOverlayPortal>
      <AnimatePresence>
        {open ? (
          <div className={`${arcadeBackdropClass} pointer-events-auto`} onClick={close}>
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              className={`relative z-10 w-full max-w-lg ${arcadePanelClass}`}
              role="dialog"
              aria-modal="true"
              onClick={(ev) => ev.stopPropagation()}
            >
              <div className={arcadeHeaderRow}>
                <div>
                  <h2 className={arcadeTitleClass}>{title}</h2>
                  <p className="mt-1 font-body text-xs text-white/45">{subtitle}</p>
                </div>
                <button type="button" className={arcadeCloseBtnClass} onClick={close} aria-label="Close">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className={arcadeTabRow} role="tablist" aria-label="Account actions">
                <button
                  type="button"
                  role="tab"
                  id="auth-tab-login"
                  aria-selected={tab === "login"}
                  aria-controls={loginPanelId}
                  className={arcadeTabBtn(tab === "login")}
                  onClick={() => {
                    setTab("login");
                    setErr(null);
                  }}
                >
                  Log in
                </button>
                <button
                  type="button"
                  role="tab"
                  id="auth-tab-register"
                  aria-selected={tab === "register"}
                  aria-controls={registerPanelId}
                  className={arcadeTabBtn(tab === "register")}
                  onClick={() => {
                    setTab("register");
                    setErr(null);
                  }}
                >
                  Create account
                </button>
              </div>

              {err ? (
                <p
                  className="mb-3 rounded-lg border border-gvc-orange/30 bg-black/40 px-3 py-2 font-body text-sm text-gvc-orange"
                  role="alert"
                >
                  {err}
                </p>
              ) : null}

              {tab === "login" ? (
                <form className="space-y-3" onSubmit={onLogin} id={loginPanelId} role="tabpanel" aria-labelledby="auth-tab-login">
                  <div>
                    <label className="font-body text-[10px] uppercase tracking-widest text-white/40">Username</label>
                    <input
                      value={loginId}
                      onChange={(e) => setLoginId(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2.5 font-body text-sm text-white outline-none focus:border-gvc-gold/40"
                      autoComplete="username"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-body text-[10px] uppercase tracking-widest text-white/40">Password</label>
                    <input
                      type="password"
                      value={loginPw}
                      onChange={(e) => setLoginPw(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2.5 font-body text-sm text-white outline-none focus:border-gvc-gold/40"
                      autoComplete="current-password"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    aria-busy={loading}
                    className="flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-gvc-gold py-3 font-display text-sm font-black uppercase text-gvc-black disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        Signing in…
                      </>
                    ) : (
                      "Log in"
                    )}
                  </button>
                </form>
              ) : (
                <form
                  className="space-y-3"
                  onSubmit={onRegister}
                  id={registerPanelId}
                  role="tabpanel"
                  aria-labelledby="auth-tab-register"
                >
                  <div>
                    <label className="font-body text-[10px] uppercase tracking-widest text-white/40">Username</label>
                    <input
                      value={regUser}
                      onChange={(e) => setRegUser(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2.5 font-body text-sm text-white outline-none focus:border-gvc-gold/40"
                      autoComplete="username"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-body text-[10px] uppercase tracking-widest text-white/40">Password</label>
                    <input
                      type="password"
                      value={regPw}
                      onChange={(e) => setRegPw(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2.5 font-body text-sm text-white outline-none focus:border-gvc-gold/40"
                      autoComplete="new-password"
                      required
                      minLength={8}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    aria-busy={loading}
                    className="flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-gvc-gold py-3 font-display text-sm font-black uppercase text-gvc-black disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        Creating account…
                      </>
                    ) : (
                      "Create account"
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </ArcadeOverlayPortal>
  );
}
