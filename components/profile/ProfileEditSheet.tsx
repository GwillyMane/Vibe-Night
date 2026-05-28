"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, Lock, Sparkles, X } from "lucide-react";
import toast from "react-hot-toast";
import { ProfileHeroCore } from "@/components/profile/ProfileHeroCore";
import {
  arcadeBackdropClass,
  arcadeCloseBtnClass,
  arcadePanelClass,
  arcadeTabBtn,
  arcadeTabRow,
} from "@/components/game/gamePanelStyles";
import { useAuth } from "@/hooks/useAuth";
import { useProfileCollections } from "@/hooks/useProfileCollections";
import { GAME_LIBRARY } from "@/lib/games/catalog";
import { TITLE_RARITY_CLASS } from "@/lib/profile/catalog";
import {
  mergeProfilePreview,
  type ProfileCustomizationDraft,
} from "@/lib/profile/profilePreview";
import {
  profileAvatarGlowClass,
  profileBorderClass,
  profileHeroShellClass,
  PROFILE_SHEET_BACKDROP,
  RARITY_CHIP_CLASS,
} from "@/lib/profile/profileStyles";
import { avatarUrlForFaceId } from "@/lib/profile/profileUi";
import type { CollectionItem, CollectionsSnapshot, PinnedBadge } from "@/lib/profile/types";
import { rewardBadgeUrlForKey, REWARD_BADGE_FALLBACK_SRC } from "@/lib/gvcRewardBadges";

type EditSection = "identity" | "style" | "showcase";

const SECTIONS: { id: EditSection; label: string }[] = [
  { id: "identity", label: "Identity" },
  { id: "style", label: "Style" },
  { id: "showcase", label: "Showcase" },
];

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 font-body text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
      {children}
    </p>
  );
}

function EquipChip({
  active,
  locked,
  onClick,
  children,
  className = "",
}: {
  active?: boolean;
  locked?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={locked}
      onClick={onClick}
      className={`relative shrink-0 rounded-xl border px-3 py-2 font-body text-xs transition active:scale-[0.97] ${
        locked
          ? "cursor-not-allowed border-white/8 bg-black/30 text-white/30"
          : active
            ? "border-gvc-gold/50 bg-gvc-gold/12 text-gvc-gold shadow-[0_0_16px_rgba(255,224,72,0.15)]"
            : "border-white/10 bg-white/[0.03] text-white/70 hover:border-gvc-gold/25 hover:text-white"
      } ${className}`}
    >
      {active ? (
        <Check className="absolute right-1.5 top-1.5 h-3 w-3 text-gvc-gold" aria-hidden />
      ) : null}
      {children}
    </button>
  );
}

function FacePicker({
  faces,
  activeId,
  onSelect,
}: {
  faces: CollectionItem[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none]">
      {faces.map((f) => (
        <button
          key={f.id}
          type="button"
          disabled={!f.unlocked}
          onClick={() => f.unlocked && onSelect(f.id)}
          className={`relative shrink-0 overflow-hidden rounded-2xl border-2 transition active:scale-[0.96] ${
            !f.unlocked
              ? "border-white/8 opacity-40 grayscale"
              : activeId === f.id
                ? "border-gvc-gold shadow-[0_0_20px_rgba(255,224,72,0.25)]"
                : "border-white/12 hover:border-gvc-gold/35"
          }`}
        >
          <Image
            src={avatarUrlForFaceId(f.id)}
            alt={f.label}
            width={64}
            height={64}
            className="h-16 w-16 object-cover"
          />
          {!f.unlocked ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Lock className="h-4 w-4 text-white/50" />
            </div>
          ) : null}
        </button>
      ))}
    </div>
  );
}

function TitlePicker({
  titles,
  activeId,
  onSelect,
}: {
  titles: CollectionItem[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const groups = useMemo(() => {
    const order = ["legendary", "rare", "common"] as const;
    return order.map((r) => ({
      rarity: r,
      items: titles.filter((t) => t.rarity === r),
    }));
  }, [titles]);

  return (
    <div className="space-y-4">
      {groups.map(({ rarity, items }) =>
        items.length ? (
          <div key={rarity}>
            <span
              className={`mb-2 inline-block rounded-full border px-2 py-0.5 font-body text-[9px] uppercase tracking-wider ${RARITY_CHIP_CLASS[rarity as keyof typeof RARITY_CHIP_CLASS]}`}
            >
              {rarity}
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
                  {!t.unlocked ? <Lock className="h-3.5 w-3.5" /> : activeId === t.id ? <Check className="h-3.5 w-3.5 text-gvc-gold" /> : null}
                </button>
              ))}
            </div>
          </div>
        ) : null,
      )}
    </div>
  );
}

function BadgeGrid({
  badges,
  activeKey,
  pinnedKeys,
  onSelect,
  mode,
}: {
  badges: CollectionItem[];
  activeKey?: string | null;
  pinnedKeys?: Set<string>;
  onSelect: (key: string) => void;
  mode: "featured" | "pin";
}) {
  const sorted = useMemo(
    () =>
      [...badges].sort((a, b) => {
        if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
        return a.label.localeCompare(b.label);
      }),
    [badges],
  );

  const unlocked = sorted.filter((b) => b.unlocked);
  const locked = sorted.filter((b) => !b.unlocked);

  const renderTile = (b: CollectionItem) => {
    const isActive = mode === "featured" ? activeKey === b.id : pinnedKeys?.has(b.id);
    return (
      <button
        key={b.id}
        type="button"
        disabled={!b.unlocked}
        onClick={() => b.unlocked && onSelect(b.id)}
        className={`relative flex flex-col items-center rounded-xl border p-2 transition active:scale-[0.97] ${
          !b.unlocked
            ? "cursor-not-allowed border-[#2a2a2a] bg-[#0c0c0c] opacity-45 grayscale"
            : isActive
              ? "border-gvc-gold/55 bg-[#1a1608] shadow-[0_0_16px_rgba(255,224,72,0.18)]"
              : "border-[#2a2a2a] bg-[#141414] hover:border-gvc-gold/35"
        }`}
      >
        {isActive ? (
          <Check className="absolute right-1.5 top-1.5 h-3 w-3 text-gvc-gold" aria-hidden />
        ) : null}
        <div className="relative flex h-14 w-14 items-center justify-center">
          <Image
            src={b.imageUrl ?? rewardBadgeUrlForKey(b.id) ?? "/shaka.png"}
            alt=""
            width={56}
            height={56}
            className="h-14 w-14 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]"
            unoptimized
          />
          {!b.unlocked ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Lock className="h-3.5 w-3.5 text-[#888] drop-shadow-md" aria-hidden />
            </div>
          ) : null}
        </div>
        <p className="mt-1.5 line-clamp-2 min-h-[2rem] w-full text-center font-display text-[9px] font-bold uppercase leading-tight text-[#d4d4d4]">
          {b.label}
        </p>
      </button>
    );
  };

  return (
    <div className="space-y-4">
      {unlocked.length > 0 ? (
        <div>
          <p className="mb-2 font-body text-[10px] uppercase tracking-wider text-[#888]">
            Unlocked · {unlocked.length}
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{unlocked.map(renderTile)}</div>
        </div>
      ) : (
        <p className="rounded-xl border border-[#2a2a2a] bg-[#141414] px-3 py-6 text-center font-body text-sm text-[#888]">
          No badges unlocked yet — play daily runs to earn some.
        </p>
      )}
      {locked.length > 0 ? (
        <div>
          <p className="mb-2 font-body text-[10px] uppercase tracking-wider text-[#666]">
            Locked · {locked.length}
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{locked.map(renderTile)}</div>
        </div>
      ) : null}
    </div>
  );
}

function StyleRow({
  label,
  items,
  activeId,
  field,
  onSelect,
  swatch,
}: {
  label: string;
  items: CollectionItem[];
  activeId: string;
  field: keyof ProfileCustomizationDraft;
  onSelect: (field: keyof ProfileCustomizationDraft, id: string) => void;
  swatch: (id: string) => string;
}) {
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none]">
        {items.filter((c) => c.unlocked).map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(field, c.id)}
            className={`flex shrink-0 flex-col items-center gap-1.5 rounded-xl border p-2 transition active:scale-[0.96] ${
              activeId === c.id
                ? "border-gvc-gold/50 bg-gvc-gold/8"
                : "border-white/10 hover:border-gvc-gold/25"
            }`}
          >
            <div className={`h-10 w-14 rounded-lg border ${swatch(c.id)}`} />
            <span className="max-w-[72px] truncate font-body text-[9px] text-white/55">{c.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function themeSwatch(id: string): string {
  return `${profileHeroShellClass(id)} border`;
}

function borderSwatch(id: string): string {
  return `bg-[#121212] ${profileBorderClass(id)}`;
}

function glowSwatch(id: string): string {
  return `bg-[#121212] border border-white/10 ${profileAvatarGlowClass(id)}`;
}

export function ProfileEditSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile, refreshProfile } = useAuth();
  const { collections, loading: collectionsLoading } = useProfileCollections(open);
  const [section, setSection] = useState<EditSection>("identity");
  const [draft, setDraft] = useState<ProfileCustomizationDraft>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDraft({});
    setSection("identity");
  }, [open]);

  const preview = useMemo(
    () => (profile ? mergeProfilePreview(profile, draft) : null),
    [profile, draft],
  );

  const resolveBadgeUrl = useCallback(
    (key: string) => {
      const item = collections?.badges.find((b) => b.id === key);
      return item?.imageUrl ?? rewardBadgeUrlForKey(key) ?? REWARD_BADGE_FALLBACK_SRC;
    },
    [collections],
  );

  const applyDraft = useCallback((draftPatch: ProfileCustomizationDraft) => {
    setDraft((d) => ({ ...d, ...draftPatch }));
  }, []);

  const patch = useCallback(
    async (body: Record<string, unknown>, draftPatch: ProfileCustomizationDraft) => {
      applyDraft(draftPatch);
      setSaving(true);
      try {
        const res = await fetch("/api/profile/me", {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { error?: string }).error ?? "Save failed");
        }
        await refreshProfile();
      } catch (e) {
        setDraft((d) => {
          const next = { ...d };
          for (const k of Object.keys(draftPatch) as (keyof ProfileCustomizationDraft)[]) {
            delete next[k];
          }
          return next;
        });
        toast.error((e as Error).message);
      } finally {
        setSaving(false);
      }
    },
    [applyDraft, refreshProfile],
  );

  const selectStyle = (field: keyof ProfileCustomizationDraft, id: string) => {
    void patch({ [field]: id }, { [field]: id });
  };

  const togglePin = (badgeKey: string) => {
    if (!profile || !collections) return;
    const badge = collections.badges.find((b) => b.id === badgeKey);
    if (!badge?.unlocked) return;

    const current = draft.pinnedBadges ?? profile.pinnedBadges;
    const existing = current.find((p) => p.badgeKey === badgeKey);
    if (existing) {
      const next = current.filter((p) => p.badgeKey !== badgeKey);
      void patch({ pinnedBadges: next }, { pinnedBadges: next });
      return;
    }

    const usedSlots = new Set(current.map((p) => p.slot));
    let slot = 0;
    while (usedSlots.has(slot) && slot < 4) slot++;
    if (slot >= 4) {
      toast.error("All 4 pin slots are full — tap a pinned badge to remove it first.");
      return;
    }
    const next: PinnedBadge[] = [...current, { slot, badgeKey }];
    void patch({ pinnedBadges: next }, { pinnedBadges: next });
  };

  const pinnedKeySet = useMemo(
    () => new Set((preview?.pinnedBadges ?? []).map((p) => p.badgeKey)),
    [preview?.pinnedBadges],
  );

  if (!profile || !preview) return null;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className={`${arcadeBackdropClass} z-[95]`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button type="button" className={PROFILE_SHEET_BACKDROP} aria-label="Close" onClick={onClose} />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            className={`relative z-10 flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden ${arcadePanelClass} rounded-b-none sm:max-h-[min(92dvh,860px)] sm:rounded-3xl`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-[3] shrink-0 border-b border-white/8 bg-[#0c0c0c]/95 pb-3 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-gvc-gold" aria-hidden />
                  <h2 className="font-display text-base font-black uppercase tracking-wide text-shimmer sm:text-lg">
                    Identity studio
                  </h2>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin text-gvc-gold/70" aria-label="Saving" /> : null}
                </div>
                <button type="button" className={arcadeCloseBtnClass} onClick={onClose} aria-label="Close">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-3">
                <ProfileHeroCore
                  key={`studio-${preview.featuredBadgeKey ?? "none"}-${preview.avatarFaceId}-${preview.equippedTitleId}`}
                  profile={preview}
                  badgeSrc={resolveBadgeUrl}
                  compact
                  showMeta={false}
                />
              </div>

              <div className={`${arcadeTabRow} mt-3`}>
                {SECTIONS.map((s) => (
                  <button key={s.id} type="button" className={arcadeTabBtn(section === s.id)} onClick={() => setSection(s.id)}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
              {collectionsLoading || !collections ? (
                <div className="flex items-center gap-2 py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-gvc-gold" />
                  <p className="font-body text-sm text-white/45">Loading collection…</p>
                </div>
              ) : section === "identity" ? (
                <div className="space-y-5">
                  <div>
                    <SectionLabel>Avatar</SectionLabel>
                    <FacePicker
                      faces={collections.faces}
                      activeId={preview.avatarFaceId}
                      onSelect={(id) => void patch({ avatarFaceId: id }, { avatarFaceId: id })}
                    />
                  </div>
                  <div>
                    <SectionLabel>Title</SectionLabel>
                    <TitlePicker
                      titles={collections.titles}
                      activeId={preview.equippedTitleId}
                      onSelect={(id) => void patch({ equippedTitleId: id }, { equippedTitleId: id })}
                    />
                  </div>
                  <div>
                    <SectionLabel>Featured badge</SectionLabel>
                    <BadgeGrid
                      badges={collections.badges}
                      activeKey={preview.featuredBadgeKey}
                      mode="featured"
                      onSelect={(key) => void patch({ featuredBadgeKey: key }, { featuredBadgeKey: key })}
                    />
                  </div>
                  <div>
                    <SectionLabel>Favorite game</SectionLabel>
                    <div className="flex flex-wrap gap-2">
                      {GAME_LIBRARY.filter((g) => g.status === "available").map((g) => (
                        <EquipChip
                          key={g.id}
                          active={preview.favoriteGameId === g.id}
                          onClick={() => void patch({ favoriteGameId: g.id }, { favoriteGameId: g.id })}
                        >
                          {g.shortTitle}
                        </EquipChip>
                      ))}
                    </div>
                  </div>
                </div>
              ) : section === "style" ? (
                <div className="space-y-5">
                  <StyleRow
                    label="Profile theme"
                    items={collections.themes}
                    activeId={preview.themeId}
                    field="themeId"
                    onSelect={selectStyle}
                    swatch={themeSwatch}
                  />
                  <StyleRow
                    label="Avatar border"
                    items={collections.borders}
                    activeId={preview.borderId}
                    field="borderId"
                    onSelect={selectStyle}
                    swatch={borderSwatch}
                  />
                  <StyleRow
                    label="Glow"
                    items={collections.glows}
                    activeId={preview.glowId}
                    field="glowId"
                    onSelect={selectStyle}
                    swatch={glowSwatch}
                  />
                  <StyleRow
                    label="Background energy"
                    items={collections.backgrounds}
                    activeId={preview.backgroundId}
                    field="backgroundId"
                    onSelect={selectStyle}
                    swatch={(id) =>
                      id === "bloom" ? "bg-gradient-to-br from-pink-accent/30 to-transparent border border-pink-accent/20" :
                      id === "stack" ? "bg-gradient-to-br from-gvc-orange/25 to-transparent border border-gvc-orange/20" :
                      "bg-gradient-to-br from-gvc-gold/20 to-transparent border border-gvc-gold/20"
                    }
                  />
                  <StyleRow
                    label="Particles"
                    items={collections.particles}
                    activeId={preview.particleId}
                    field="particleId"
                    onSelect={selectStyle}
                    swatch={() => "bg-[#121212] border border-gvc-gold/25 relative overflow-hidden before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_30%_70%,rgba(255,224,72,0.35),transparent_50%)]"}
                  />
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
                    <p className="font-display text-xs font-bold uppercase text-gvc-gold">Collection progress</p>
                    <p className="mt-1 font-body text-sm text-white/60">
                      {collections.badges.filter((b) => b.unlocked).length}/{collections.badges.length} badges ·{" "}
                      {collections.titles.filter((t) => t.unlocked).length}/{collections.titles.length} titles
                    </p>
                  </div>
                  <div>
                    <SectionLabel>Pinned badges (up to 4)</SectionLabel>
                    <p className="mb-3 font-body text-xs text-[#888]">Tap a badge to pin it · tap again to remove</p>
                    <div className="mb-4 grid grid-cols-4 gap-2">
                      {[0, 1, 2, 3].map((slot) => {
                        const pin = preview.pinnedBadges.find((p) => p.slot === slot);
                        return (
                          <button
                            key={slot}
                            type="button"
                            disabled={!pin}
                            onClick={() => {
                              if (!pin) return;
                              const next = preview.pinnedBadges.filter((p) => p.slot !== slot);
                              void patch({ pinnedBadges: next }, { pinnedBadges: next });
                            }}
                            className={`flex aspect-square flex-col items-center justify-center overflow-hidden rounded-xl border transition ${
                              pin
                                ? "border-gvc-gold/40 bg-[#1a1608] hover:border-gvc-gold/60 active:scale-[0.97]"
                                : "border-dashed border-[#333] bg-[#0c0c0c]"
                            }`}
                          >
                            {pin ? (
                              <>
                                <Image
                                  src={resolveBadgeUrl(pin.badgeKey)}
                                  alt=""
                                  width={48}
                                  height={48}
                                  className="h-10 w-10 object-cover sm:h-12 sm:w-12"
                                  unoptimized
                                />
                                <span className="mt-1 font-body text-[8px] uppercase text-[#888]">Remove</span>
                              </>
                            ) : (
                              <span className="font-body text-[10px] text-[#555]">Slot {slot + 1}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <BadgeGrid
                      badges={collections.badges}
                      pinnedKeys={pinnedKeySet}
                      mode="pin"
                      onSelect={togglePin}
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
