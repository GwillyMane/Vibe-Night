"use client";

import { useMemo, useState } from "react";
import { Check, Lock } from "lucide-react";
import { GAME_LIBRARY, type GameId } from "@/lib/games/catalog";
import { TITLE_RARITY_CLASS } from "@/lib/profile/catalog";
import { RARITY_CHIP_CLASS } from "@/lib/profile/profileStyles";
import type { CollectionItem } from "@/lib/profile/types";

type TitleFilter = "all" | "meta" | GameId;

const TITLE_FILTERS: { id: TitleFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "meta", label: "Arcade" },
  ...GAME_LIBRARY.map((g) => ({ id: g.id as TitleFilter, label: g.shortTitle })),
];

function filterTitles(titles: CollectionItem[], filter: TitleFilter): CollectionItem[] {
  if (filter === "all") return titles;
  if (filter === "meta") return titles.filter((t) => t.category === "meta" || t.id === "vibe-night-regular");
  return titles.filter((t) => t.gameId === filter);
}

function groupTitles(titles: CollectionItem[]): { key: string; label: string; items: CollectionItem[] }[] {
  const meta = titles.filter((t) => t.category === "meta" || (!t.gameId && t.id === "vibe-night-regular"));
  const groups: { key: string; label: string; items: CollectionItem[] }[] = [];

  if (meta.length) {
    groups.push({
      key: "meta",
      label: "Arcade & meta",
      items: meta.sort((a, b) => a.label.localeCompare(b.label)),
    });
  }

  for (const game of GAME_LIBRARY) {
    const items = titles
      .filter((t) => t.gameId === game.id)
      .sort((a, b) => {
        if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
        return a.label.localeCompare(b.label);
      });
    if (items.length) {
      const unlocked = items.filter((t) => t.unlocked).length;
      groups.push({
        key: game.id,
        label: `${game.shortTitle} · ${unlocked}/${items.length}`,
        items,
      });
    }
  }

  return groups;
}

export function TitleFilterChips({
  filter,
  onChange,
}: {
  filter: TitleFilter;
  onChange: (f: TitleFilter) => void;
}) {
  return (
    <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none]">
      {TITLE_FILTERS.map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => onChange(f.id)}
          className={`shrink-0 rounded-full border px-3 py-1.5 font-body text-[10px] font-semibold uppercase tracking-wide transition ${
            filter === f.id
              ? "border-gvc-gold/45 bg-gvc-gold/10 text-gvc-gold"
              : "border-[#2a2a2a] bg-[#0c0c0c] text-[#888] hover:border-gvc-gold/25"
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

export function TitleCollectionReadOnly({ titles }: { titles: CollectionItem[] }) {
  const [filter, setFilter] = useState<TitleFilter>("all");
  const filtered = useMemo(() => filterTitles(titles, filter), [titles, filter]);
  const groups = useMemo(() => groupTitles(filtered), [filtered]);

  return (
    <>
      <TitleFilterChips filter={filter} onChange={setFilter} />
      <div className="space-y-5">
        {groups.map(({ key, label, items }) => (
          <div key={key}>
            <p className="mb-2 font-body text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9e9e9e]">
              {label}
            </p>
            <ul className="space-y-1.5">
              {items.map((t) => (
                <li
                  key={t.id}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2.5 ${
                    t.unlocked ? "border-[#2a2a2a] bg-[#141414]" : "border-[#222] bg-[#0c0c0c] opacity-55"
                  }`}
                >
                  <span
                    className={`font-display text-xs font-bold uppercase ${
                      t.unlocked ? TITLE_RARITY_CLASS[t.rarity as keyof typeof TITLE_RARITY_CLASS] : "text-[#555]"
                    }`}
                  >
                    {t.label}
                  </span>
                  <span className="flex items-center gap-1.5 font-body text-[10px] text-[#666]">
                    {!t.unlocked ? (
                      <>
                        <Lock className="h-3 w-3" />
                        Locked
                      </>
                    ) : t.equipped ? (
                      <span className="text-gvc-gold">Equipped</span>
                    ) : (
                      "Unlocked"
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}

export function TitlePickerList({
  titles,
  activeId,
  onSelect,
}: {
  titles: CollectionItem[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const [filter, setFilter] = useState<TitleFilter>("all");
  const filtered = useMemo(() => filterTitles(titles, filter), [titles, filter]);
  const groups = useMemo(() => groupTitles(filtered), [filtered]);

  return (
    <>
      <TitleFilterChips filter={filter} onChange={setFilter} />
      <div className="space-y-4">
        {groups.map(({ key, label, items }) => (
          <div key={key}>
            <span
              className={`mb-2 inline-block rounded-full border px-2 py-0.5 font-body text-[9px] uppercase tracking-wider ${
                RARITY_CHIP_CLASS.rare
              }`}
            >
              {label}
            </span>
            <div className="flex flex-col gap-1.5">
              {items.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  disabled={!t.unlocked}
                  onClick={() => t.unlocked && onSelect(t.id)}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left transition active:scale-[0.99] ${
                    !t.unlocked
                      ? "border-white/8 bg-black/20 text-white/30"
                      : activeId === t.id
                        ? "border-gvc-gold/45 bg-gvc-gold/10"
                        : "border-white/10 bg-white/[0.02] hover:border-gvc-gold/25"
                  }`}
                >
                  <span
                    className={`font-display text-xs font-bold uppercase ${
                      t.unlocked ? TITLE_RARITY_CLASS[t.rarity as keyof typeof TITLE_RARITY_CLASS] : ""
                    }`}
                  >
                    {t.label}
                  </span>
                  {!t.unlocked ? (
                    <Lock className="h-3.5 w-3.5" />
                  ) : activeId === t.id ? (
                    <Check className="h-3.5 w-3.5 text-gvc-gold" />
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
