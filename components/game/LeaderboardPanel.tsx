"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { LocalLeaderRow } from "@/lib/storage";
import type { LeaderboardApiRow } from "@/lib/leaderboardApi";
import { playUiClick } from "@/lib/sounds";
import { GameModal } from "./GameModal";
import { arcadeTabBtn, arcadeTabRow } from "./gamePanelStyles";
import { LeaderboardSkeleton } from "@/components/arcade/LeaderboardSkeleton";

type Scope = "daily" | "weekly" | "alltime";
type ViewMode = "level" | "daily";

function filterRows(rows: LocalLeaderRow[], scope: Scope): LocalLeaderRow[] {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  return rows.filter((r) => {
    const t = new Date(r.createdAt).getTime();
    if (Number.isNaN(t)) return scope === "alltime";
    if (scope === "alltime") return true;
    if (scope === "daily") return now - t < day;
    if (scope === "weekly") return now - t < 7 * day;
    return true;
  });
}

function rowTag(r: LocalLeaderRow): string {
  if (r.mode === "daily") return "Daily";
  if (r.mode === "level" && r.levelId) return `Lv ${r.levelId}`;
  return "";
}

function mapApiToLocal(rows: LeaderboardApiRow[]): LocalLeaderRow[] {
  return rows.map((r) => ({
    username: r.username,
    score: r.score,
    scope: "alltime",
    createdAt: r.createdAt,
    stars: r.stars,
    levelId: r.levelId,
    seed: r.seed ?? undefined,
    mode: r.mode as "daily" | "level",
  }));
}

export interface LeaderboardPanelProps {
  open: boolean;
  onClose: () => void;
  rows: LocalLeaderRow[];
  muted: boolean;
  defaultDailySeed: string;
}

export function LeaderboardPanel({ open, onClose, rows: fallbackRows, muted, defaultDailySeed }: LeaderboardPanelProps) {
  const [tab, setTab] = useState<Scope>("daily");
  const [viewMode, setViewMode] = useState<ViewMode>("level");
  const [levelId, setLevelId] = useState("1");
  const [dailySeed, setDailySeed] = useState(defaultDailySeed);
  const [apiRows, setApiRows] = useState<LeaderboardApiRow[] | null>(null);
  const [meRank, setMeRank] = useState<number | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) setDailySeed(defaultDailySeed);
  }, [open, defaultDailySeed]);

  const load = useCallback(async () => {
    setFetchError(null);
    setLoading(true);
    const params = new URLSearchParams();
    params.set("scope", tab);
    params.set("mode", viewMode);
    params.set("limit", "10");
    params.set("includeMe", "1");
    if (viewMode === "level") params.set("levelId", levelId);
    if (viewMode === "daily") params.set("seed", dailySeed);
    try {
      const res = await fetch(`/api/scores?${params.toString()}`, { credentials: "include" });
      const data = (await res.json()) as { rows?: LeaderboardApiRow[]; me?: LeaderboardApiRow; error?: string };
      if (!res.ok) {
        setApiRows(null);
        setMeRank(null);
        setFetchError(data.error ?? "Leaderboard unavailable");
        return;
      }
      setApiRows(data.rows ?? []);
      setMeRank(data.me?.rank ?? null);
    } catch {
      setApiRows(null);
      setMeRank(null);
      setFetchError("Network error");
    } finally {
      setLoading(false);
    }
  }, [tab, viewMode, levelId, dailySeed]);

  useEffect(() => {
    if (!open) return;
    void load();
  }, [open, load]);

  const mergedFallback = useMemo(
    () => filterRows(fallbackRows, tab).sort((a, b) => b.score - a.score).slice(0, 10),
    [fallbackRows, tab]
  );

  const displayRows: LocalLeaderRow[] = useMemo(() => {
    if (loading) return [];
    if (fetchError) return mergedFallback;
    if (apiRows === null) return [];
    return mapApiToLocal(apiRows);
  }, [apiRows, mergedFallback, fetchError, loading]);

  const usingFallback = Boolean(fetchError) && !loading;

  return (
    <GameModal
      open={open}
      onClose={onClose}
      title="Leaderboard"
      subtitle={
        usingFallback
          ? "Showing local scores — cloud data unavailable."
          : "Live scores — America/New_York day and week windows."
      }
      muted={muted}
      tall
    >
      <div className="mb-3 flex flex-wrap gap-2">
        <div className={`${arcadeTabRow} min-w-[200px] flex-1`}>
          <button type="button" className={arcadeTabBtn(viewMode === "level")} onClick={() => setViewMode("level")}>
            Levels
          </button>
          <button type="button" className={arcadeTabBtn(viewMode === "daily")} onClick={() => setViewMode("daily")}>
            Daily
          </button>
        </div>
      </div>

      {viewMode === "level" ? (
        <label className="mb-3 flex flex-col gap-1 font-body text-[11px] text-white/50">
          Level
          <select
            value={levelId}
            onChange={(e) => setLevelId(e.target.value)}
            className="rounded-xl border border-white/12 bg-black/50 px-3 py-2 font-display text-sm text-white"
          >
            {Array.from({ length: 20 }, (_, i) => String(i + 1)).map((id) => (
              <option key={id} value={id}>
                Level {id}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <label className="mb-3 flex flex-col gap-1 font-body text-[11px] text-white/50">
          Daily seed
          <input
            value={dailySeed}
            onChange={(e) => setDailySeed(e.target.value)}
            className="rounded-xl border border-white/12 bg-black/50 px-3 py-2 font-mono text-sm text-white"
            placeholder="YYYY-MM-DD"
          />
        </label>
      )}

      <div className={arcadeTabRow}>
        {(["daily", "weekly", "alltime"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              playUiClick(muted);
              setTab(s);
            }}
            className={arcadeTabBtn(tab === s)}
          >
            {s === "daily" ? "Daily" : s === "weekly" ? "Weekly" : "All-time"}
          </button>
        ))}
      </div>

      {meRank != null && !usingFallback && !loading ? (
        <p className="mb-2 font-body text-xs text-gvc-gold">
          Your rank: <span className="font-display font-bold">#{meRank}</span>
        </p>
      ) : null}

      {loading ? (
        <LeaderboardSkeleton />
      ) : (
      <ol className="space-y-2 pb-1">
        {displayRows.length === 0 ? (
          <li className="rounded-xl border border-dashed border-gvc-gold/20 bg-black/35 px-3 py-8 text-center font-body text-sm text-white/45">
            No scores in this window yet — send a crash and claim the top.
          </li>
        ) : (
          displayRows.map((r, i) => (
            <li
              key={`${r.username}-${r.createdAt}-${i}`}
              className="flex items-center justify-between gap-2 rounded-xl border border-white/[0.07] bg-black/40 px-3 py-2.5"
            >
              <div className="min-w-0 text-left">
                <p className="font-body text-sm text-white/85">
                  <span className="mr-2 font-display text-gvc-gold/90">
                    {apiRows && !fetchError ? apiRows[i]?.rank ?? i + 1 : i + 1}.
                  </span>
                  {r.username !== "YOU" ? (
                    <Link href={`/profile/${encodeURIComponent(r.username)}`} className="hover:text-gvc-gold">
                      {r.username}
                    </Link>
                  ) : (
                    r.username
                  )}
                </p>
                <p className="mt-0.5 font-body text-[10px] uppercase tracking-wider text-white/35">
                  {rowTag(r)}
                  {r.stars != null ? ` · ${r.stars}★` : ""}
                </p>
              </div>
              <span className="shrink-0 font-display text-lg text-gvc-gold">{r.score}</span>
            </li>
          ))
        )}
      </ol>
      )}
    </GameModal>
  );
}
