"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useGlobalAudio } from "@/contexts/GlobalAudioContext";
import { hasSeenMusicIntro, markMusicIntroSeen } from "@/lib/audio/audioPersistence";
import { MiniPlayer } from "./MiniPlayer";
import { ExpandedPlayer } from "./ExpandedPlayer";

export function ArcadeMusicPlayer() {
  const { expanded, setExpanded, isPlaying } = useGlobalAudio();
  const [reducedMotion, setReducedMotion] = useState(false);

  function hasOtherVisibleToasts() {
    const container = document.querySelector("[data-rht-toaster]");
    if (!container) return false;
    return container.querySelectorAll("div[style]").length > 0;
  }

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (hasSeenMusicIntro()) return;

    let retryTimer: number | undefined;

    const tryIntroToast = () => {
      if (hasSeenMusicIntro() || isPlaying) return;
      if (hasOtherVisibleToasts()) {
        retryTimer = window.setTimeout(tryIntroToast, 2000);
        return;
      }
      toast("Vibe Night has a soundtrack — tap play when you're ready.", {
        icon: "🎵",
        duration: 4000,
        id: "music-intro",
      });
      markMusicIntroSeen();
    };

    const t = window.setTimeout(tryIntroToast, 4000);
    return () => {
      window.clearTimeout(t);
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
    };
  }, [isPlaying]);

  return (
    <>
      {!expanded ? (
        <div
          className="pointer-events-none fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-[70] w-[min(calc(100%-1.5rem),280px)] -translate-x-1/2 sm:left-auto sm:right-4 sm:w-auto sm:max-w-[280px] sm:translate-x-0"
          aria-live="polite"
        >
          <div className="pointer-events-auto">
            <MiniPlayer
              reducedMotion={reducedMotion}
              compact
              onExpand={() => setExpanded(true)}
            />
          </div>
        </div>
      ) : null}

      <ExpandedPlayer open={expanded} reducedMotion={reducedMotion} onClose={() => setExpanded(false)} />
    </>
  );
}
