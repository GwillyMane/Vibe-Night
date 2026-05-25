import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfilePageClient } from "@/components/profile/ProfilePageClient";
import { dbAvailable, ensureTables, getPool } from "@/lib/db";
import { PASSPORT_SIZE } from "@/lib/passport/themeTokens";
import { fetchPublicProfile } from "@/lib/profile/queries";
import { getCurrentUserFromRequest } from "@/lib/session";
import { headers } from "next/headers";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  if (!dbAvailable()) {
    return { title: `${username} · Vibe Night` };
  }
  try {
    await ensureTables();
    const profile = await fetchPublicProfile(getPool()!, username);
    if (!profile) return { title: "Profile not found · Vibe Night" };
    return {
      title: `${profile.username} · ${profile.equippedTitleLabel} · Vibe Night`,
      description: `${profile.username}'s arcade passport — ${profile.arcadeTier} tier, ${profile.streak.currentStreak} day streak.`,
      openGraph: profile.passportUrl
        ? {
            title: `${profile.username} · Vibe Night Passport`,
            description: `Check out my Vibe Night Passport — ${profile.arcadeTier} tier, ${profile.streak.currentStreak} day streak.`,
            images: [{
              url: profile.passportUrl,
              width: PASSPORT_SIZE.width,
              height: PASSPORT_SIZE.height,
              alt: `${profile.username} Vibe Night Passport`,
            }],
          }
        : undefined,
    };
  } catch {
    return { title: `${username} · Vibe Night` };
  }
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  if (!username?.trim()) notFound();

  if (!dbAvailable()) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-xl font-black uppercase text-white">Profiles unavailable</h1>
        <p className="mt-2 font-body text-sm text-white/50">Database not configured.</p>
      </main>
    );
  }

  await ensureTables();
  const h = await headers();
  const cookie = h.get("cookie") ?? "";
  const viewerReq = new Request("http://localhost", { headers: { cookie } });
  const viewer = await getCurrentUserFromRequest(viewerReq);

  const profile = await fetchPublicProfile(getPool()!, username, viewer?.id ?? null);
  if (!profile) notFound();

  return <ProfilePageClient profile={profile} />;
}
