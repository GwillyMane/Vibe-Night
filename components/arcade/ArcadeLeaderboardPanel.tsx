"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { LeaderboardApiRow } from "@/lib/leaderboardApi";
import { playUiClick } from "@/lib/sounds";
import { GameModal } from "@/components/game/GameModal";
import { arcadeTabBtn, arcadeTabRow } from "@/components/game/gamePanelStyles";

type Scope = "daily" | "weekly" | "alltime";
type ArcadeMode = "classic" | "daily";

export interface ArcadeLeaderboardPanelProps {
  open: boolean;
  onClose: () => void;
  muted: boolean;
  title: string;
  subtitle?: string;
  gameId: string;
  levelId: string;
  /** When set, daily leaderboard is filtered to this shared puzzle seed (other arcade games). */
  dailySeed?: string;
}

export function ArcadeLeaderboardPanel({
  open,
  onClose,
  muted,
  title,
  subtitle = "Vibe Night leaderboard",
  gameId,
  levelId,
  dailySeed,
}: ArcadeLeaderboardPanelProps) {
  const [tab, setTab] = useState<Scope>("daily");
  const [mode, setMode] = useState<ArcadeMode>("classic");
  const [rows, setRows] = useState<LeaderboardApiRow[]>([]);
  const [me, setMe] = useState<LeaderboardApiRow | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    const params = new URLSearchParams();
    params.set("gameId", gameId);
    params.set("scope", tab);
    params.set("mode", mode);
    params.set("levelId", levelId);
    params.set("limit", "10");
    params.set("includeMe", "1");
    if (mode === "daily" && dailySeed) params.set("seed", dailySeed);
    try {
      const res = await fetch(`/api/scores?${params}`, { credentials: "include" });
      const data = (await res.json()) as { rows?: LeaderboardApiRow[]; me?: LeaderboardApiRow; error?: string };
      if (!res.ok) {
        setErr(data.error ?? "Could not load leaderboard");
        setRows([]);
        setMe(null);
        return;
      }
      setRows(data.rows ?? []);
      setMe(data.me ?? null);
    } catch {
      setErr("Network error");
      setRows([]);
      setMe(null);
    }
  }, [tab, mode, gameId, levelId, dailySeed]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  return (
    <GameModal open={open} onClose={onClose} title={title} subtitle={subtitle} muted={muted} tall>
      <div className={arcadeTabRow}>
        <button
          type="button"
          className={arcadeTabBtn(mode === "classic")}
          onClick={() => {
            playUiClick(muted);
            setMode("classic");
          }}
        >
          Classic
        </button>
        <button
          type="button"
          className={arcadeTabBtn(mode === "daily")}
          onClick={() => {
            playUiClick(muted);
            setMode("daily");
          }}
        >
          Daily
        </button>
      </div>
      <div className={`${arcadeTabRow} mb-3`}>
        {(["daily", "weekly", "alltime"] as Scope[]).map((s) => (
          <button
            key={s}
            type="button"
            className={arcadeTabBtn(tab === s)}
            onClick={() => {
              playUiClick(muted);
              setTab(s);
            }}
          >
            {s === "alltime" ? "All time" : s}
          </button>
        ))}
      </div>
      {mode === "daily" ? (
        <p className="mb-3 font-body text-[10px] text-white/40">
          {dailySeed ? (
            <>
              Today&apos;s daily · <span className="font-mono text-gvc-gold/80">{dailySeed}</span>
            </>
          ) : (
            "Daily runs · random boards each session"
          )}
        </p>
      ) : null}
      {err ? <p className="font-body text-sm text-gvc-orange">{err}</p> : null}
      <ul className="space-y-2">
        {rows.length === 0 && !err ? (
          <li className="rounded-lg border border-white/8 bg-black/40 px-3 py-4 text-center font-body text-xs text-white/40">
            No scores yet — be the first!
          </li>
        ) : null}
        {rows.map((r) => (
          <li
            key={`${r.rank}-${r.username}-${r.score}`}
            className="flex items-center justify-between gap-2 rounded-lg border border-white/8 bg-black/40 px-3 py-2"
          >
            <span className="w-8 font-display text-xs font-bold text-gvc-gold">#{r.rank}</span>
            <span className="min-w-0 flex-1 truncate font-body text-sm text-white/80">
              <Link href={`/profile/${encodeURIComponent(r.username)}`} className="hover:text-gvc-gold">
                {r.username}
              </Link>
            </span>
            <span className="font-display text-sm font-bold tabular-nums text-white">{r.score.toLocaleString()}</span>
          </li>
        ))}
      </ul>
      {me ? (
        <p className="mt-3 text-center font-body text-xs text-white/50">
          Your rank: #{me.rank} · {me.score.toLocaleString()}
        </p>
      ) : null}
    </GameModal>
  );
}
