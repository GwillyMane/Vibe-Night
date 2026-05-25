/**
 * Full-viewport decor behind app chrome (not inside game canvas).
 * Assets from https://goodvibesclub.ai/api/brand (library).
 *
 * Gold layer: do NOT put `opacity` or `filter` on the same element as `mix-blend-mode` —
 * browsers composite that subtree in isolation first, so it often stops blending with the
 * inverted pattern below (reads as “missing”). Strength: softer `mix-blend-soft-light`
 * plus a neutral dim veil on this stack (not on the gold layer itself).
 */
const GVC_ICON_PATTERN_002 =
  "https://aagrmr5pocteyhfg.public.blob.vercel-storage.com/brand-assets/textures/1776711661027-gvc_iconpattern_002.webp";

const GVC_GOLD_TEXTURE_SKIN_BLUR =
  "https://aagrmr5pocteyhfg.public.blob.vercel-storage.com/brand-assets/textures/1777416676431-ULTRAMACRO_GoldSkin_Blurred.webp";

export function SiteBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat invert"
          style={{
            backgroundImage: `url("${GVC_ICON_PATTERN_002}")`,
          }}
        />
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat mix-blend-soft-light"
          style={{
            backgroundImage: `url("${GVC_GOLD_TEXTURE_SKIN_BLUR}")`,
          }}
        />
        <div className="absolute inset-0 bg-gvc-black/25" />
      </div>
      <div
        className="absolute inset-0 bg-repeat"
        style={{
          backgroundImage: "url(/grid.svg)",
        }}
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-[70vh] bg-[radial-gradient(ellipse_at_50%_100%,rgba(255,224,72,0.1)_0%,rgba(255,224,72,0.04)_40%,transparent_70%)]"
      />
    </div>
  );
}
