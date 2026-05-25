import type { GameId } from "@/lib/games/catalog";
import { getGameById } from "@/lib/games/catalog";
import { absoluteUrl } from "@/lib/siteUrl";

const HASHTAGS = "#GoodVibesClub #VibeNight #Vibeathon";

export interface SharePayload {
  gameId: GameId | "vibe-crashers";
  score: number;
  mode?: string;
  seed?: string;
  lines?: string[];
  playerName?: string;
}

export function buildArcadeShareText(payload: SharePayload): string {
  const game = getGameById(payload.gameId);
  const title = game?.shortTitle ?? "Vibe Night";
  const parts = [
    ...(payload.lines ?? []),
    `Score: ${payload.score.toLocaleString()}`,
  ];
  if (payload.mode) parts.push(`Mode: ${payload.mode}`);
  if (payload.seed) parts.push(`Daily seed: ${payload.seed}`);
  parts.push(`Can you beat my run in ${title}?`);
  parts.push(HASHTAGS);
  return parts.join("\n");
}

export function dailyChallengeUrl(gameId: GameId | "vibe-crashers", seed: string): string {
  if (typeof window === "undefined") return "";
  const routes: Record<string, string> = {
    "vibe-crashers": "/",
    "vibe-merge": "/vibe-merge",
    "vibe-garden": "/vibe-garden",
    "catch-a-vibe": "/catch-a-vibe",
    "vibe-shift": "/vibe-shift",
    "lucky-vibes": "/lucky-vibes",
  };
  const base = `${window.location.origin}${routes[gameId] ?? "/"}`;
  return `${base}?seed=${encodeURIComponent(seed)}`;
}

export function twitterIntent(text: string): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

export async function copyShareText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function ogScoreCardUrl(params: {
  game: string;
  name?: string;
  score: number;
  mode?: string;
  origin?: string;
}): string {
  const q = new URLSearchParams();
  q.set("game", params.game);
  q.set("score", String(params.score));
  if (params.name) q.set("name", params.name);
  if (params.mode) q.set("mode", params.mode);
  const base =
    params.origin ??
    (typeof window !== "undefined" ? window.location.origin : absoluteUrl("").replace(/\/$/, ""));
  return `${base}/api/og/score?${q.toString()}`;
}

export function buildArcadeShareTextWithOg(payload: SharePayload & { playerName?: string }): string {
  const game = getGameById(payload.gameId);
  const og = ogScoreCardUrl({
    game: game?.shortTitle ?? "Vibe Night",
    name: payload.playerName ?? "Player",
    score: payload.score,
    mode: payload.mode,
  });
  return `${buildArcadeShareText(payload)}\n${og}`;
}
