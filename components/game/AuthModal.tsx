"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { playUiClick } from "@/lib/sounds";
import { useAuth } from "@/hooks/useAuth";
import { VIBE_NIGHT } from "@/lib/brand";
import { arcadeBackdropClass, arcadeCloseBtnClass, arcadeHeaderRow, arcadePanelClass, arcadeTitleClass, arcadeTabBtn, arcadeTabRow } from "./gamePanelStyles";

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

  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [loginId, setLoginId] = useState("");
  const [loginPw, setLoginPw] = useState("");

  const [regUser, setRegUser] = useState("");
  const [regPw, setRegPw] = useState("");

  const close = () => {
    playUiClick(muted);
    setErr(null);
    onClose();
  };

  if (!dbConfigured) {
    return (
      <AnimatePresence>
        {open ? (
          <motion.div
            className={`${arcadeBackdropClass} pointer-events-auto z-[95]`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.button type="button" className="absolute inset-0 z-0 bg-black/75 backdrop-blur-sm" aria-label="Close" onClick={close} />
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              className={`relative z-10 w-full max-w-lg ${arcadePanelClass}`}
              role="dialog"
              aria-modal="true"
            >
              <div className={arcadeHeaderRow}>
                <h2 className={arcadeTitleClass}>Accounts</h2>
                <button type="button" className={arcadeCloseBtnClass} onClick={close} aria-label="Close">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="font-body text-sm text-white/60">
                Cloud accounts need a database. Set <span className="font-mono text-gvc-gold/90">DATABASE_URL</span> on the
                server — you can still play as a guest locally.
              </p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    );
  }

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const ok = await login(loginId, loginPw);
      if (ok) {
        close();
        setLoginPw("");
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
      const ok = await register(regUser, regPw);
      if (ok) {
        close();
        setRegPw("");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className={`${arcadeBackdropClass} pointer-events-auto z-[95]`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.button type="button" className="absolute inset-0 z-0 bg-black/75 backdrop-blur-sm" aria-label="Close" onClick={close} />
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

            <div className={arcadeTabRow}>
              <button type="button" className={arcadeTabBtn(tab === "login")} onClick={() => setTab("login")}>
                Log in
              </button>
              <button type="button" className={arcadeTabBtn(tab === "register")} onClick={() => setTab("register")}>
                Create account
              </button>
            </div>

            {err ? <p className="mb-3 rounded-lg border border-gvc-orange/30 bg-black/40 px-3 py-2 font-body text-sm text-gvc-orange">{err}</p> : null}

            {tab === "login" ? (
              <form className="space-y-3" onSubmit={onLogin}>
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
                  className="w-full min-h-[48px] rounded-xl bg-gvc-gold py-3 font-display text-sm font-black uppercase text-gvc-black disabled:opacity-50"
                >
                  {loading ? "…" : "Log in"}
                </button>
              </form>
            ) : (
              <form className="space-y-3" onSubmit={onRegister}>
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
                  className="w-full min-h-[48px] rounded-xl bg-gvc-gold py-3 font-display text-sm font-black uppercase text-gvc-black disabled:opacity-50"
                >
                  {loading ? "…" : "Create account"}
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
