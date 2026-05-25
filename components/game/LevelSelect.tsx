"use client";

import { useMemo } from "react";
import type { LevelChapter, PhysicsLevelDefinition } from "@/lib/levels";
import { HANDCRAFTED_LEVELS, dailyHandcraftedLevelId, dailyPersistKey, getHandcraftedLevel } from "@/lib/levels";
import { loadPersisted } from "@/lib/storage";
import { playUiClick } from "@/lib/sounds";
import { LevelSilhouette } from "./LevelSilhouette";

export interface LevelSelectProps {
  muted: boolean;
  onSelectLevel: (levelId: string) => void;
  onPracticeLevel?: (levelId: string) => void;
  onDaily: () => void;
  dailySeedPreview: string;
  /** When false, hide the daily callout (shown elsewhere, e.g. title screen). */
  embedDaily?: boolean;
}

function persistKeyForLevel(id: string) {
  return `lv:${id}`;
}

const CHAPTER_ORDER: LevelChapter[] = ["basics", "collapse", "materials", "expert"];

const CHAPTER_LABEL: Record<LevelChapter, string> = {
  basics: "Basics",
  collapse: "Collapse lessons",
  materials: "Material tricks",
  expert: "Expert crashes",
};

export function LevelSelect({ muted, onSelectLevel, onPracticeLevel, onDaily, dailySeedPreview, embedDaily = true }: LevelSelectProps) {
  const p = useMemo(() => (typeof window !== "undefined" ? loadPersisted() : null), []);
  const c = () => playUiClick(muted);

  const dailyLevelId = dailyHandcraftedLevelId(dailySeedPreview);
  const dailyLevel = getHandcraftedLevel(dailyLevelId);
  const dailyKey = dailyPersistKey(dailySeedPreview, dailyLevelId);
  const bestDaily = p?.bestByLevel[dailyKey] ?? 0;

  const byChapter = useMemo(() => {
    const m = new Map<LevelChapter, PhysicsLevelDefinition[]>();
    for (const ch of CHAPTER_ORDER) m.set(ch, []);
    for (const lv of HANDCRAFTED_LEVELS) {
      m.get(lv.chapter)?.push(lv);
    }
    return m;
  }, []);

  return (
    <div className="flex w-full flex-col gap-3">
      {embedDaily ? (
        <div className="rounded-xl border border-pink-accent/25 bg-black/40 p-3">
          <p className="font-display text-[10px] font-bold uppercase tracking-[0.22em] text-pink-accent/90">Today&apos;s crash</p>
          <p className="mt-1 font-display text-sm font-black uppercase text-gvc-gold">{dailyLevel?.name ?? "—"}</p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-body text-[10px] text-white/45">
            <span>
              Seed <span className="font-mono text-gvc-gold/85">{dailySeedPreview}</span>
            </span>
            {dailyLevel ? (
              <span>
                Difficulty <span className="text-white/70">{dailyLevel.difficulty}</span>
              </span>
            ) : null}
            <span>
              Best <span className="text-white/75">{bestDaily || "—"}</span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              c();
              onDaily();
            }}
            className="mt-3 w-full rounded-lg border border-gvc-gold/40 bg-gvc-gold/10 py-2.5 font-display text-xs font-bold uppercase tracking-wide text-gvc-gold transition hover:border-gvc-gold/70 hover:bg-gvc-gold/15"
          >
            Play daily
          </button>
        </div>
      ) : null}

      <p className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">20 handcrafted levels</p>

      <div className="relative z-[1] flex max-h-[min(44vh,360px)] flex-col gap-3 overflow-y-auto pr-1">
        {CHAPTER_ORDER.map((chapter) => {
          const list = byChapter.get(chapter) ?? [];
          if (!list.length) return null;
          return (
            <div key={chapter}>
              <p className="sticky top-0 z-[1] mb-2 bg-gvc-dark/95 py-1 font-display text-[9px] font-bold uppercase tracking-widest text-white/35">
                {CHAPTER_LABEL[chapter]}
              </p>
              <div className="grid grid-cols-1 gap-2">
                {list.map((lv) => {
                  const key = persistKeyForLevel(lv.id);
                  const best = p?.bestByLevel[key] ?? 0;
                  const stars = p?.bestStarsByLevel[key] ?? 0;
                  const isTodaysDaily = lv.id === dailyLevelId;
                  return (
                    <button
                      key={lv.id}
                      type="button"
                      onClick={() => {
                        c();
                        onSelectLevel(lv.id);
                      }}
                      className={`cursor-pointer touch-manipulation rounded-xl border p-3 text-left transition active:scale-[0.99] ${
                        isTodaysDaily
                          ? "border-pink-accent/40 bg-black/45 hover:border-pink-accent/55 hover:bg-black/55"
                          : "border-white/[0.08] bg-black/35 hover:border-gvc-gold/35 hover:bg-black/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <LevelSilhouette
                          targetCount={lv.targets?.length ?? 2}
                          blockCount={lv.blocks?.length ?? 12}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-display text-[11px] font-black uppercase text-gvc-gold/90">
                            {lv.number}. {lv.shortName}
                          </p>
                          <p className="font-display text-xs font-black uppercase text-gvc-gold">{lv.name}</p>
                          <p className="mt-1 font-body text-[11px] leading-snug text-white/50">{lv.description}</p>
                        </div>
                        <span className="shrink-0 rounded-md border border-white/10 px-1.5 py-0.5 font-mono text-[9px] uppercase text-white/35">
                          {lv.difficulty}
                        </span>
                      </div>
                      {isTodaysDaily ? (
                        <p className="mt-1.5 font-body text-[10px] font-medium uppercase tracking-wide text-pink-accent/80">
                          Today&apos;s daily layout
                        </p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-body text-[10px] text-white/40">
                        <span>
                          Shots <span className="text-gvc-gold/90">{lv.availableShots}</span>
                        </span>
                        <span>
                          Par <span className="text-white/60">{lv.parShots}</span>
                        </span>
                        <span>
                          Best <span className="text-white/70">{best || "—"}</span>
                        </span>
                        <span className="text-gvc-gold/80">
                          {"★".repeat(Math.min(3, stars))}
                          {stars ? "" : "—"}
                        </span>
                      </div>
                      {lv.hint ? (
                        <p className="mt-1.5 border-t border-white/[0.06] pt-1.5 font-body text-[10px] text-white/35">Hint: {lv.hint}</p>
                      ) : null}
                      {onPracticeLevel ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            c();
                            onPracticeLevel(lv.id);
                          }}
                          className="mt-2 rounded-lg border border-gvc-green/30 bg-gvc-green/10 px-2 py-1 font-display text-[9px] font-bold uppercase tracking-wide text-gvc-green hover:border-gvc-green/50"
                        >
                          Practice
                        </button>
                      ) : null}
                      <p className="mt-2 font-display text-[10px] font-bold uppercase tracking-wider text-gvc-gold/90">Play level →</p>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {embedDaily ? (
        <>
          <button
            type="button"
            onClick={() => {
              c();
              onDaily();
            }}
            className="w-full rounded-xl border border-gvc-gold/35 bg-black/40 px-4 py-3 font-display text-sm font-bold uppercase tracking-wide text-gvc-gold transition hover:border-gvc-gold/60 hover:bg-black/60"
          >
            Daily challenge
          </button>
          <p className="font-body text-xs text-white/35">
            Same handcrafted layout for everyone on a seed — use <span className="font-mono text-white/50">?seed=YYYY-MM-DD</span> or any
            text to preview.
          </p>
        </>
      ) : (
        <p className="font-body text-[11px] text-white/35">
          Tip: use <span className="font-mono text-white/45">?seed=</span> to preview a daily pick.
        </p>
      )}
    </div>
  );
}
