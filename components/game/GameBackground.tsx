"use client";

type Props = {
  slingNormX: number;
  slingNormY: number;
  /** GVC brand library backdrop — see https://goodvibesclub.ai/library */
  backgroundUrl: string;
  /** Menu uses brighter art; gameplay dims art so the Matter arena reads clearly. */
  variant?: "menu" | "gameplay";
};

/** Backdrop: GVC library art + vignette + radial sling glow (readability over Matter canvas). */
export function GameBackground({ slingNormX, slingNormY, backgroundUrl, variant = "menu" }: Props) {
  const isPlay = variant === "gameplay";
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      {backgroundUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element -- dynamic remote brand URL */
        <img
          key={backgroundUrl}
          src={backgroundUrl}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover opacity-[0.85]`}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : null}
      <div
        className={`absolute inset-0 bg-gradient-to-b ${isPlay ? "from-[#050505]/92 via-[#050505]/55 to-[#050505]/96" : "from-[#050505]/78 via-transparent to-[#050505]/94"}`}
        aria-hidden
      />
      <div
        className={`absolute inset-0 ${isPlay ? "shadow-[inset_0_0_100px_rgba(0,0,0,0.82)]" : "shadow-[inset_0_0_80px_rgba(0,0,0,0.72)]"}`}
        aria-hidden
      />
      <div
        className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,224,72,0.14)_0%,transparent_68%)] ${isPlay ? "h-[48%] w-[48%] opacity-90" : "h-[55%] w-[55%]"}`}
        style={{
          left: `${slingNormX * 100}%`,
          top: `${slingNormY * 100}%`,
        }}
        aria-hidden
      />
    </div>
  );
}
