"use client";

import { useState } from "react";
import Image from "next/image";

type Props = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  fallbackSrc?: string;
};

/** Image with graceful fallback for IPFS / remote URLs. */
export function AssetSprite({ src, alt, width, height, className, fallbackSrc = "/shaka.png" }: Props) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <Image src={fallbackSrc} alt={alt} width={width} height={height} className={className} />;
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      unoptimized
      onError={() => setFailed(true)}
    />
  );
}
