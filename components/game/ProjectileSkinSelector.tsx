"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import type { ProjectileSkinId } from "@/lib/assets/projectileSkins";

export interface TokenOption {
  id: string;
  name: string;
  imageUrl: string;
}

export type FaceSkinOption = { slug: string; label: string; imageUrl: string };

type Props = {
  value: ProjectileSkinId;
  tokens: TokenOption[];
  faces: FaceSkinOption[];
  onChange: (id: ProjectileSkinId) => void;
  muted: boolean;
  variant?: "default" | "sheet";
};

function arcadeStatsForSkin(id: ProjectileSkinId): { power: number; control: number; bounce: number; weight: number } {
  if (id === "gold") return { power: 5, control: 3, bounce: 4, weight: 4 };
  if (id === "badge") return { power: 4, control: 4, bounce: 3, weight: 3 };
  if (id === "shaka") return { power: 3, control: 5, bounce: 3, weight: 2 };
  if (id.startsWith("face:")) return { power: 3, control: 5, bounce: 3, weight: 2 };
  if (id.startsWith("token:")) return { power: 4, control: 4, bounce: 3, weight: 3 };
  return { power: 3, control: 4, bounce: 3, weight: 3 };
}

function StatBar({ label, v }: { label: string; v: number }) {
  return (
    <div>
      <div className="flex justify-between font-body text-[9px] uppercase tracking-wider text-white/40">
        <span>{label}</span>
        <span className="text-gvc-gold/90">{v}/5</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/60">
        <div className="h-full rounded-full bg-gradient-to-r from-gvc-orange/80 to-gvc-gold" style={{ width: `${(v / 5) * 100}%` }} />
      </div>
    </div>
  );
}

function SkinThumb({
  label,
  active,
  src,
  onClick,
  fallback,
  circularThumb,
}: {
  label: string;
  active: boolean;
  src?: string | null;
  onClick: () => void;
  fallback: ReactNode;
  /** Library face + GVC token bitmaps: clip to circle on canvas / in picker. */
  circularThumb?: boolean;
}) {
  const [err, setErr] = useState(false);
  const frameClass = circularThumb
    ? "rounded-full ring-1 ring-white/15 ring-inset"
    : "rounded-lg";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-xl border p-2 transition active:scale-[0.98] ${
        active
          ? "border-gvc-gold/70 bg-gvc-gold/10 shadow-[0_0_20px_rgba(255,224,72,0.28)]"
          : "border-white/[0.08] bg-black/30 hover:border-gvc-gold/30"
      }`}
    >
      <div
        className={`relative flex h-14 w-14 items-center justify-center overflow-hidden bg-[#0a0a0a] ${frameClass}`}
      >
        {src && !err ? (
          <Image
            src={src}
            alt=""
            fill
            className="object-cover"
            sizes="56px"
            unoptimized
            onError={() => setErr(true)}
          />
        ) : (
          fallback
        )}
      </div>
      <span className="max-w-[72px] truncate font-body text-[9px] uppercase tracking-wide text-white/55">{label}</span>
    </button>
  );
}

export function ProjectileSkinSelector({ value, tokens, faces, onChange, muted: _muted, variant = "default" }: Props) {
  const st = arcadeStatsForSkin(value);
  const shell =
    variant === "sheet"
      ? "w-full rounded-2xl border border-gvc-gold/15 bg-black/25 p-3 text-left"
      : "w-full rounded-2xl border border-white/[0.08] bg-black/35 p-4 text-left backdrop-blur-sm";

  return (
    <div className={shell}>
      <p className="font-display text-xs font-bold uppercase tracking-widest text-gvc-gold/90">Collection</p>
      <p className="mt-1 font-body text-[11px] text-white/45">
        Cosmetic loadouts — same physics, different energy. Saved on this device.
      </p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <SkinThumb
          label="Shaka"
          active={value === "shaka"}
          src="/shaka.png"
          onClick={() => onChange("shaka")}
          fallback={<span className="text-lg">✋</span>}
        />
        <SkinThumb
          label="Gold orb"
          active={value === "gold"}
          onClick={() => onChange("gold")}
          fallback={
            <span
              className="h-10 w-10 rounded-full"
              style={{
                background: "radial-gradient(circle at 30% 30%, #fff8c8, #FFE048 45%, #6a5218)",
              }}
            />
          }
        />
        <SkinThumb
          label="Badge"
          active={value === "badge"}
          onClick={() => onChange("badge")}
          fallback={
            <span className="text-[10px] font-display font-black text-gvc-gold/80">GVC</span>
          }
        />
        {faces.map((f) => (
          <SkinThumb
            key={f.slug}
            label={f.label}
            active={value === `face:${f.slug}`}
            src={f.imageUrl}
            onClick={() => onChange(`face:${f.slug}`)}
            fallback={<span className="text-lg">😎</span>}
            circularThumb
          />
        ))}
        {tokens.map((t) => (
          <SkinThumb
            key={t.id}
            label={t.name}
            active={value === `token:${t.id}`}
            src={t.imageUrl}
            onClick={() => onChange(`token:${t.id}`)}
            fallback={<Image src="/shaka.png" alt="" width={40} height={40} />}
            circularThumb
          />
        ))}
      </div>
      {variant === "sheet" ? (
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-white/[0.06] bg-black/35 p-3">
          <StatBar label="Power" v={st.power} />
          <StatBar label="Control" v={st.control} />
          <StatBar label="Bounce" v={st.bounce} />
          <StatBar label="Weight" v={st.weight} />
        </div>
      ) : null}
    </div>
  );
}
