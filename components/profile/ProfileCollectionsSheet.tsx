"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import toast from "react-hot-toast";
import { useProfileCollections } from "@/hooks/useProfileCollections";
import { GAME_LIBRARY, type GameId } from "@/lib/games/catalog";
import {
  PROFILE_PANEL,
  PROFILE_PANEL_BODY,
  PROFILE_PANEL_HEADER,
  PROFILE_SECTION_TITLE,
  PROFILE_SHEET_BACKDROP,
} from "@/lib/profile/profileStyles";
import { CollectionBadgeGrid } from "./CollectionBadgeGrid";
import { TitleCollectionReadOnly } from "./TitleCollectionList";

type CollectionsTab = "badges" | "titles";
type GameFilter = GameId | "all";

const GAME_FILTERS: { id: GameFilter; label: string }[] = [
  { id: "all", label: "All" },
  ...GAME_LIBRARY.map((g) => ({ id: g.id as GameId, label: g.shortTitle })),
];

function CollectionsBadgeSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-xl border border-[#2a2a2a] bg-[#141414] p-2.5">
          <div className="mx-auto h-16 w-16 rounded-lg bg-[#1F1F1F]" />
          <div className="mx-auto mt-2 h-3 w-3/4 rounded bg-[#1F1F1F]" />
          <div className="mx-auto mt-1.5 h-2 w-1/2 rounded bg-[#1F1F1F]" />
        </div>
      ))}
    </div>
  );
}

export function ProfileCollectionsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { collections, loading, reload } = useProfileCollections(open);
  const [tab, setTab] = useState<CollectionsTab>("badges");
  const [gameFilter, setGameFilter] = useState<GameFilter>("all");

  useEffect(() => {
    if (!open) return;
    setTab("badges");
    setGameFilter("all");
  }, [open]);

  const badgeStats = useMemo(() => {
    if (!collections) return { unlocked: 0, total: 0 };
    return {
      unlocked: collections.badges.filter((b) => b.unlocked).length,
      total: collections.badges.length,
    };
  }, [collections]);

  const titleStats = useMemo(() => {
    if (!collections) return { unlocked: 0, total: 0 };
    return {
      unlocked: collections.titles.filter((t) => t.unlocked).length,
      total: collections.titles.length,
    };
  }, [collections]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[95] flex items-end justify-center sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button type="button" className={PROFILE_SHEET_BACKDROP} aria-label="Close" onClick={onClose} />

          <motion.div
            initial={{ y: 48, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 32, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className={`relative z-10 flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden ${PROFILE_PANEL}`}
          >
            <div className={`shrink-0 ${PROFILE_PANEL_HEADER}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-body text-[10px] font-semibold uppercase tracking-[0.18em] text-[#888]">Vibe Night</p>
                  <h2 className="mt-0.5 font-display text-xl font-black uppercase tracking-wide text-[#FFE048]">
                    Collections
                  </h2>
                  <p className="mt-1 font-body text-xs text-[#9e9e9e]">Badges earned across all six arcade games</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#2a2a2a] bg-[#0c0c0c] text-[#c4c4c4] transition hover:border-gvc-gold/35 hover:text-gvc-gold"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 flex gap-2">
                {(["badges", "titles"] as CollectionsTab[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={`flex-1 rounded-xl border py-2.5 font-display text-[10px] font-bold uppercase tracking-wider transition ${
                      tab === t
                        ? "border-gvc-gold/45 bg-gvc-gold/10 text-gvc-gold"
                        : "border-[#2a2a2a] bg-[#0c0c0c] text-[#888] hover:border-gvc-gold/25"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className={`min-h-0 flex-1 overflow-y-auto ${PROFILE_PANEL_BODY}`}>
              {loading ? (
                <CollectionsBadgeSkeleton />
              ) : collections ? (
                <>
                  <div className="mb-4 flex items-center gap-3 rounded-xl border border-gvc-gold/25 bg-[#1a1608] px-3 py-3">
                    <Sparkles className="h-5 w-5 shrink-0 text-gvc-gold" />
                    <div>
                      <p className={PROFILE_SECTION_TITLE}>
                        {tab === "badges"
                          ? `${badgeStats.unlocked}/${badgeStats.total} badges`
                          : `${titleStats.unlocked}/${titleStats.total} titles`}
                      </p>
                      <p className="mt-0.5 font-body text-[11px] text-[#b3b3b3]">
                        {tab === "badges"
                          ? "Official GVC library art pairs with in-game achievements"
                          : "Earn titles by hitting milestones across the arcade"}
                      </p>
                    </div>
                  </div>

                  {tab === "badges" ? (
                    <>
                      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none]">
                        {GAME_FILTERS.map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setGameFilter(f.id)}
                            className={`shrink-0 rounded-full border px-3 py-1.5 font-body text-[10px] font-semibold uppercase tracking-wide transition ${
                              gameFilter === f.id
                                ? "border-gvc-gold/45 bg-gvc-gold/10 text-gvc-gold"
                                : "border-[#2a2a2a] bg-[#0c0c0c] text-[#888] hover:border-gvc-gold/25"
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                      <CollectionBadgeGrid badges={collections.badges} gameFilter={gameFilter} />
                    </>
                  ) : (
                    <TitleCollectionReadOnly titles={collections.titles} />
                  )}
                </>
              ) : (
                <div className="py-12 text-center">
                  <p className="font-body text-sm text-[#888]">Could not load collection.</p>
                  <button
                    type="button"
                    onClick={() => {
                      void reload().catch(() => toast.error("Could not load your collection"));
                    }}
                    className="mt-3 rounded-xl border border-gvc-gold/35 px-4 py-2 font-display text-xs font-bold uppercase text-gvc-gold"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
