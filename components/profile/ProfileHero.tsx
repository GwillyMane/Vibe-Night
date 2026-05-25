"use client";

import { ProfileHeroCore } from "@/components/profile/ProfileHeroCore";
import type { PublicProfile } from "@/lib/profile/types";

interface ProfileHeroProps {
  profile: PublicProfile;
  badgeSrc?: (key: string) => string | undefined;
}

export function ProfileHero({ profile, badgeSrc }: ProfileHeroProps) {
  return <ProfileHeroCore profile={profile} badgeSrc={badgeSrc} showMeta />;
}
