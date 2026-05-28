"use client";

import { useCallback } from "react";
import toast from "react-hot-toast";
import type { GameId } from "@/lib/games/catalog";
import {
  buildArcadeShareTextWithOg,
  copyShareText,
  twitterIntent,
  type SharePayload,
} from "@/lib/arcade/share";
import { playUiClick } from "@/lib/sounds";

export function useArcadeShare(opts: {
  muted: boolean;
  gameId: GameId;
  score: number;
  mode?: string;
  seed?: string;
  lines?: string[];
  copyToast?: string;
}) {
  const { muted, gameId, score, mode, seed, lines, copyToast = "Score copied — paste it anywhere." } = opts;

  const payload: SharePayload = { gameId, score, mode, seed, lines };

  const shareToTwitter = useCallback(() => {
    playUiClick(muted);
    const text = buildArcadeShareTextWithOg(payload);
    window.open(twitterIntent(text), "_blank", "noopener,noreferrer");
  }, [muted, gameId, score, mode, seed, lines]);

  const copyScore = useCallback(async () => {
    playUiClick(muted);
    const line = buildArcadeShareTextWithOg(payload);
    const ok = await copyShareText(line);
    if (ok) toast.success(copyToast, { duration: 2000 });
    else toast.error("Could not copy", { duration: 2000 });
  }, [muted, gameId, score, mode, seed, lines, copyToast]);

  return { shareToTwitter, copyScore };
}
