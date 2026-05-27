"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/** Renders overlays at document.body so they sit above the music player and site chrome. */
export function ArcadeOverlayPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}
