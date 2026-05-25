"use client";

import { arcadeMenuBtnClass, arcadePrimaryCtaClass, arcadeShareBtnClass } from "@/components/game/gamePanelStyles";
import { playUiClick } from "@/lib/sounds";

export interface ArcadeResultActionsProps {
  muted: boolean;
  retryLabel?: string;
  shareLabel?: string;
  showShare?: boolean;
  showSignIn?: boolean;
  onRetry: () => void;
  onShare?: () => void;
  onMenu: () => void;
  onSignIn?: () => void;
}

export function ArcadeResultActions({
  muted,
  retryLabel = "One more run",
  shareLabel = "Share",
  showShare = true,
  showSignIn = false,
  onRetry,
  onShare,
  onMenu,
  onSignIn,
}: ArcadeResultActionsProps) {
  return (
    <>
      {!showSignIn || !onSignIn ? null : (
        <button
          type="button"
          onClick={() => {
            playUiClick(muted);
            onSignIn();
          }}
          className="mt-4 w-full rounded-xl border border-gvc-gold/35 py-2.5 font-display text-xs font-bold uppercase text-gvc-gold transition hover:border-gvc-gold/55 active:scale-[0.98]"
        >
          Sign in to post score
        </button>
      )}
      <div className="mt-6 flex flex-col gap-2">
        <button
          type="button"
          autoFocus
          onClick={() => {
            playUiClick(muted);
            onRetry();
          }}
          className={`${arcadePrimaryCtaClass} min-h-[52px] text-sm`}
        >
          {retryLabel}
        </button>
        {showShare && onShare ? (
          <button
            type="button"
            onClick={() => {
              playUiClick(muted);
              onShare();
            }}
            className={arcadeShareBtnClass}
          >
            {shareLabel}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => {
            playUiClick(muted);
            onMenu();
          }}
          className={arcadeMenuBtnClass}
        >
          Menu
        </button>
      </div>
    </>
  );
}
