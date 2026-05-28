"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Pencil, Share2 } from "lucide-react";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import type { PublicProfile } from "@/lib/profile/types";
import { PROFILE_NAV_BAR, PROFILE_NAV_LINK, PROFILE_PAGE_SHELL } from "@/lib/profile/profileStyles";
import { rewardBadgeUrlForKey } from "@/lib/gvcRewardBadges";
import { useAuth } from "@/hooks/useAuth";
import { ProfileHero } from "./ProfileHero";
import { ProfileIdentityBar } from "./ProfileIdentityBar";
import { ProfileStatsRow } from "./ProfileStatsRow";
import { ProfileActivityFeed } from "./ProfileActivityFeed";
import { ProfileBadgeShowcase } from "./ProfileBadgeShowcase";
import { ProfilePassportCard } from "./ProfilePassportCard";
import { ProfileSection } from "./ProfileSection";

const ProfileEditSheet = dynamic(() => import("./ProfileEditSheet").then((m) => m.ProfileEditSheet), { ssr: false });
const ProfileCollectionsSheet = dynamic(
  () => import("./ProfileCollectionsSheet").then((m) => m.ProfileCollectionsSheet),
  { ssr: false }
);

export function ProfilePageClient({ profile }: { profile: PublicProfile }) {
  const { profile: authProfile, refreshProfile } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [passportUrl, setPassportUrl] = useState<string | null>(profile.passportUrl);

  /** Owner view: auth profile stays in sync after Identity Studio saves. */
  const displayProfile =
    profile.isOwner && authProfile ? authProfile : profile;

  const passportProfile: PublicProfile = {
    ...displayProfile,
    passportUrl: passportUrl ?? displayProfile.passportUrl,
  };

  const shareProfile = useCallback(async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const passport = passportProfile.passportUrl;
    const text = passport
      ? `Check out my Vibe Night Passport — ${profile.username} · ${profile.equippedTitleLabel}`
      : `${profile.username} · ${profile.equippedTitleLabel} · Vibe Night Arcade`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${profile.username} · Vibe Night`,
          text,
          url,
        });
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${url}`);
      toast.success("Profile link copied");
    } catch {
      /* user cancelled share */
    }
  }, [profile.username, profile.equippedTitleLabel, passportProfile.passportUrl]);

  const onPassportGenerated = useCallback(
    (url: string) => {
      setPassportUrl(url);
      void refreshProfile();
    },
    [refreshProfile]
  );

  return (
    <div className={PROFILE_PAGE_SHELL}>
      <main className="relative mx-auto max-w-lg px-4 pb-arcade-player pt-5 sm:max-w-xl">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={PROFILE_NAV_BAR}>
          <Link href="/" className={PROFILE_NAV_LINK}>
            ← Vibe Night
          </Link>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void shareProfile()}
              className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-[#2a2a2a] bg-[#0c0c0c] text-[#d4d4d4] transition hover:border-gvc-gold/35 hover:text-gvc-gold active:scale-[0.97]"
              aria-label="Share profile"
            >
              <Share2 className="h-4 w-4" />
            </button>
            {profile.isOwner ? (
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-gvc-gold/50 bg-[#0c0c0c] px-3.5 py-2 font-display text-[10px] font-bold uppercase tracking-wide text-gvc-gold shadow-[0_0_16px_rgba(255,224,72,0.12)] transition hover:border-gvc-gold/70 hover:bg-[#141414] active:scale-[0.97]"
              >
                <Pencil className="h-3.5 w-3.5" />
                Customize
              </button>
            ) : null}
          </div>
        </motion.div>

        <ProfileHero profile={displayProfile} badgeSrc={rewardBadgeUrlForKey} />

        <ProfileSection title="Share your passport" subtitle="Social-ready identity card" delay={0.03}>
          <ProfilePassportCard profile={passportProfile} onGenerated={onPassportGenerated} />
        </ProfileSection>

        <ProfileSection title="Arcade identity" subtitle="Your rank across the night" delay={0.05}>
          <ProfileIdentityBar profile={displayProfile} />
        </ProfileSection>

        {displayProfile.stats.length > 0 ? (
          <ProfileSection title="Progression" subtitle="Cross-game highlights" delay={0.1}>
            <ProfileStatsRow stats={displayProfile.stats} />
          </ProfileSection>
        ) : null}

        <ProfileSection title="Achievements" subtitle="Pinned badges & featured unlocks" delay={0.14}>
          <ProfileBadgeShowcase profile={displayProfile} />
          {profile.isOwner ? (
            <button
              type="button"
              onClick={() => setCollectionsOpen(true)}
              className="mt-3 w-full rounded-xl border border-[#2a2a2a] bg-[#141414] py-2.5 font-body text-xs text-[#c4c4c4] transition hover:border-gvc-gold/35 hover:text-gvc-gold"
            >
              View full collection →
            </button>
          ) : null}
        </ProfileSection>

        <ProfileSection title="Recent activity" subtitle="Your latest arcade moments" delay={0.18}>
          <ProfileActivityFeed items={displayProfile.recentActivity} />
        </ProfileSection>

        {profile.isOwner ? (
          <>
            <ProfileEditSheet open={editOpen} onClose={() => setEditOpen(false)} />
            <ProfileCollectionsSheet open={collectionsOpen} onClose={() => setCollectionsOpen(false)} />
          </>
        ) : null}
      </main>
    </div>
  );
}
