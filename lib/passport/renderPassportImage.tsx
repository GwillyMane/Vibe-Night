import { readFile } from "fs/promises";
import path from "path";
import satori from "satori";
import React from "react";
import type { PublicProfile } from "@/lib/profile/types";
import { embedPassportAssets } from "./embedAssets";
import { PassportLayout } from "./PassportLayout";
import { PASSPORT_SIZE } from "./themeTokens";

type SatoriFont = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 600 | 700 | 900;
  style: "normal";
};

let fontsPromise: Promise<SatoriFont[]> | null = null;

async function loadFonts(): Promise<SatoriFont[]> {
  if (!fontsPromise) {
    fontsPromise = (async () => {
      const root = process.cwd();
      const read = (p: string) => readFile(path.join(root, "public", "fonts", p));
      const [briceBlack, briceBold, mundialReg, mundialDemi, mundialBold] = await Promise.all([
        read("Brice-Black.otf"),
        read("Brice-Bold.otf"),
        read("Mundial-Regular.otf"),
        read("MundialDemibold.otf"),
        read("Mundial-Bold.otf"),
      ]);
      const toBuf = (b: Buffer) =>
        b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
      return [
        { name: "Brice", data: toBuf(briceBlack), weight: 900, style: "normal" },
        { name: "Brice", data: toBuf(briceBold), weight: 700, style: "normal" },
        { name: "Mundial", data: toBuf(mundialReg), weight: 400, style: "normal" },
        { name: "Mundial", data: toBuf(mundialDemi), weight: 600, style: "normal" },
        { name: "Mundial", data: toBuf(mundialBold), weight: 700, style: "normal" },
      ];
    })();
  }
  return fontsPromise;
}

export async function renderPassportImage(
  profile: PublicProfile,
  opts: { origin: string; profilePath: string }
): Promise<Buffer> {
  const fonts = await loadFonts();
  const assets = await embedPassportAssets(profile, opts.origin);
  const svg = await satori(
    React.createElement(PassportLayout, {
      profile,
      origin: opts.origin,
      profilePath: opts.profilePath,
      assets,
    }),
    {
      width: PASSPORT_SIZE.width,
      height: PASSPORT_SIZE.height,
      fonts,
    }
  );
  const sharp = (await import("sharp")).default;
  return sharp(Buffer.from(svg), { density: 144 })
    .resize(PASSPORT_SIZE.width, PASSPORT_SIZE.height, { fit: "fill" })
    .png()
    .toBuffer();
}
