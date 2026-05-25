"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Download, Loader2, RefreshCw, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import type { PublicProfile } from "@/lib/profile/types";
import { PASSPORT_SIZE } from "@/lib/passport/themeTokens";
import { PROFILE_CARD, PROFILE_SECTION_TITLE } from "@/lib/profile/profileStyles";

async function downloadPassportImage(url: string, username: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = `vibe-night-passport-${username}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}

export function ProfilePassportCard({
  profile,
  onGenerated,
}: {
  profile: PublicProfile;
  onGenerated?: (url: string) => void;
}) {
  const [passportUrl, setPassportUrl] = useState(profile.passportUrl);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const generate = useCallback(async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/profile/me/passport", {
        method: "POST",
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as { passportUrl?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      if (!data.passportUrl) throw new Error("No passport URL returned");
      setPassportUrl(data.passportUrl);
      onGenerated?.(data.passportUrl);
      toast.success("Passport ready — share it!");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }, [onGenerated]);

  const download = useCallback(async () => {
    if (!passportUrl) return;
    setDownloading(true);
    try {
      await downloadPassportImage(passportUrl, profile.username);
      toast.success("Passport downloaded");
    } catch {
      toast.error("Could not download passport");
    } finally {
      setDownloading(false);
    }
  }, [passportUrl, profile.username]);

  return (
    <div className={`${PROFILE_CARD} overflow-hidden p-0`}>
      <div className="border-b border-[#2a2a2a] bg-[#141414] px-4 py-3.5">
        <p className={PROFILE_SECTION_TITLE}>Vibe Night Passport</p>
        <p className="mt-1 font-body text-xs text-[#9e9e9e]">
          Share your arcade identity — &ldquo;Check out my Vibe Night Passport&rdquo;
        </p>
      </div>

      <div className="p-4">
        {passportUrl ? (
          <div className="relative mx-auto max-w-full overflow-hidden rounded-xl border border-[#2a2a2a] shadow-[0_8px_32px_rgba(0,0,0,0.55)]">
            <Image
              src={passportUrl}
              alt={`${profile.username}'s Vibe Night Passport`}
              width={PASSPORT_SIZE.width}
              height={PASSPORT_SIZE.height}
              className="h-auto w-full"
              unoptimized
            />
            <button
              type="button"
              onClick={() => void download()}
              disabled={downloading}
              className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-xl border border-gvc-gold/45 bg-black/75 px-3 py-2 font-display text-[10px] font-bold uppercase tracking-wide text-gvc-gold backdrop-blur-sm transition hover:border-gvc-gold/70 hover:bg-black/90 disabled:opacity-60"
            >
              {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Download
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#2a2a2a] bg-[#0c0c0c] px-6 py-12 text-center">
            <Sparkles className="mb-3 h-8 w-8 text-gvc-gold/60" />
            <p className="font-body text-sm text-[#b3b3b3]">Generate a shareable passport card from your profile.</p>
          </div>
        )}

        {profile.isOwner ? (
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => void generate()}
            disabled={generating}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-gvc-gold/45 bg-gvc-gold/10 py-3 font-display text-xs font-bold uppercase tracking-wide text-gvc-gold transition hover:border-gvc-gold/65 hover:bg-gvc-gold/15 disabled:opacity-60"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : passportUrl ? (
              <>
                <RefreshCw className="h-4 w-4" />
                Regenerate passport
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate passport
              </>
            )}
          </motion.button>
        ) : passportUrl ? (
          <button
            type="button"
            onClick={() => void download()}
            disabled={downloading}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#2a2a2a] bg-[#141414] py-3 font-display text-xs font-bold uppercase tracking-wide text-[#d4d4d4] transition hover:border-gvc-gold/35 hover:text-gvc-gold disabled:opacity-60"
          >
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download passport
          </button>
        ) : null}

        {profile.passportGeneratedAt && passportUrl ? (
          <p className="mt-2 text-center font-body text-[10px] text-[#666]">
            Last generated {new Date(profile.passportGeneratedAt).toLocaleString()}
          </p>
        ) : null}
      </div>
    </div>
  );
}
