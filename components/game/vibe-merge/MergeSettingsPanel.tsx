"use client";

export function MergeSettingsPanel({
  muted,
  onToggleMute,
}: {
  muted: boolean;
  onToggleMute: () => void;
}) {
  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onToggleMute}
        className="w-full min-h-[48px] rounded-xl border border-gvc-gold/30 bg-black/50 font-display text-sm font-bold uppercase text-gvc-gold"
      >
        Sound: {muted ? "Off" : "On"}
      </button>
      <p className="font-body text-xs text-white/45">
        Respects your system reduced-motion preference for screen shake and particles.
      </p>
    </div>
  );
}
