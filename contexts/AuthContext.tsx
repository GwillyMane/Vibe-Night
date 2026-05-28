"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { loadProjectileSkinFromStorage, saveProjectileSkinToStorage } from "@/lib/assets/projectileSkins";
import { buildAllGamesSyncExtras } from "@/lib/profile/syncMerge";
import type { ProfileMe } from "@/lib/profile/types";
import { buildProgressSyncPayload } from "@/lib/progressSync";
import { loadGuestPersisted } from "@/lib/storage";
import { clearAccountCache, ensureAccountHydrated } from "@/lib/persist/accountCache";
import { isAccountMode, setAccountMode } from "@/lib/persist/accountMode";
import { flushAccountCloudSync } from "@/lib/persist/cloudSync";
import { hydrateAllFromProgressResponse } from "@/lib/persist/hydrateFromProgress";
import { mapProgressApiResponse } from "@/lib/persist/responseMapper";

export type AuthUser = {
  id: string;
  username: string;
  created_at: string;
};

export type AuthResult = { ok: true } | { ok: false; error: string };

type AuthCtx = {
  user: AuthUser | null;
  profile: ProfileMe | null;
  dbConfigured: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  login: (username: string, password: string) => Promise<AuthResult>;
  register: (username: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  syncLocalProgressToServer: (opts: { soundMuted: boolean; reducedMotion?: boolean | null }) => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<ProfileMe | null>(null);
  const [dbConfigured, setDbConfigured] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/profile/me", { credentials: "include" });
      if (!res.ok) {
        setProfile(null);
        return;
      }
      const data = (await res.json()) as { profile: ProfileMe };
      setProfile(data.profile ?? null);
    } catch {
      setProfile(null);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const data = (await res.json()) as { user: AuthUser | null; db?: boolean };
      setDbConfigured(data.db !== false);
      setUser(data.user ?? null);
      if (data.user) {
        setAccountMode(true);
        try {
          await ensureAccountHydrated();
        } catch {
          /* account cache may stay empty until next sync */
        }
        await refreshProfile();
      } else {
        setAccountMode(false);
        clearAccountCache();
        setProfile(null);
      }
    } catch {
      setDbConfigured(false);
      setUser(null);
      setAccountMode(false);
      clearAccountCache();
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [refreshProfile]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const syncLocalProgressToServer = useCallback(async (opts: { soundMuted: boolean; reducedMotion?: boolean | null }) => {
    if (typeof window !== "undefined" && isAccountMode()) {
      await flushAccountCloudSync();
      return;
    }

    const p = loadGuestPersisted();
    const skin = loadProjectileSkinFromStorage();
    const extras = buildAllGamesSyncExtras();
    const body = {
      ...buildProgressSyncPayload(p, {
        selectedProjectile: skin,
        soundMuted: opts.soundMuted,
        reducedMotion: opts.reducedMotion ?? null,
      }),
      ...extras,
    };
    const res = await fetch("/api/progress/sync", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error ?? "Sync failed");
    }
    const raw = (await res.json()) as Record<string, unknown>;
    hydrateAllFromProgressResponse(mapProgressApiResponse(raw));
    if (raw.settings && typeof raw.settings === "object") {
      const sel = (raw.settings as { selectedProjectile?: string | null }).selectedProjectile;
      if (sel) {
        saveProjectileSkinToStorage(sel as Parameters<typeof saveProjectileSkinToStorage>[0]);
      }
    }
    setAccountMode(true);
    const profile = raw.profile as ProfileMe | undefined;
    if (profile) setProfile(profile);
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false as const, error: (data as { error?: string }).error ?? "Login failed" };
      }
      setUser((data as { user: AuthUser }).user);
      try {
        await syncLocalProgressToServer({ soundMuted: loadGuestPersisted().soundMuted });
        toast.success("Progress synced to your account.");
      } catch {
        toast.error("Signed in — cloud sync failed. Your local progress is safe.");
      }
      await refresh();
      return { ok: true as const };
    },
    [refresh, syncLocalProgressToServer]
  );

  const register = useCallback(
    async (username: string, password: string) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false as const, error: (data as { error?: string }).error ?? "Could not register" };
      }
      setUser((data as { user: AuthUser }).user);
      try {
        await syncLocalProgressToServer({ soundMuted: loadGuestPersisted().soundMuted });
        toast.success("Account ready — progress synced.");
      } catch {
        toast.error("Account created — cloud sync failed. Your local progress is safe.");
      }
      await refresh();
      return { ok: true as const };
    },
    [refresh, syncLocalProgressToServer]
  );

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setAccountMode(false);
    clearAccountCache();
    setUser(null);
    setProfile(null);
    await refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      user,
      profile,
      dbConfigured,
      loading,
      refresh,
      refreshProfile,
      login,
      register,
      logout,
      syncLocalProgressToServer,
    }),
    [user, profile, dbConfigured, loading, refresh, refreshProfile, login, register, logout, syncLocalProgressToServer]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}
