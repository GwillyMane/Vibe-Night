"use client";

import Image from "next/image";
import { REWARD_BADGE_FALLBACK_SRC } from "@/lib/gvcRewardBadges";

const GLOW_CLASS = {
  none: "drop-shadow-[0_4px_12px_rgba(0,0,0,0.45)]",
  soft: "drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)]",
  gold: "drop-shadow-[0_0_22px_rgba(255,224,72,0.42)] drop-shadow-[0_4px_14px_rgba(0,0,0,0.4)]",
} as const;

export function RewardBadgeThumb({
  src,
  alt,
  size = 40,
  className = "",
  glow = "none",
}: {
  src: string | undefined;
  alt: string;
  size?: number;
  className?: string;
  glow?: keyof typeof GLOW_CLASS;
}) {
  const url = src ?? REWARD_BADGE_FALLBACK_SRC;
  const isRemote = url.startsWith("http");
  return (
    <div
      className={`relative shrink-0 ${GLOW_CLASS[glow]} ${className}`}
      style={{ width: size, height: size }}
    >
      {isRemote ? (
        <Image src={url} alt={alt} fill className="object-contain" sizes={`${size}px`} unoptimized />
      ) : (
        <Image src={url} alt={alt} fill className="object-contain" sizes={`${size}px`} />
      )}
    </div>
  );
}
