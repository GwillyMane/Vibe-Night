import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "react-hot-toast";
import { SiteBackdrop } from "@/components/SiteBackdrop";
import { VibeNightShell } from "@/components/VibeNightShell";
import { absoluteUrl, siteMetadataBase } from "@/lib/siteUrl";
import "./globals.css";

const brice = localFont({
  src: [
    { path: "../public/fonts/Brice-Bold.otf", weight: "700" },
    { path: "../public/fonts/Brice-Black.otf", weight: "900" },
  ],
  variable: "--font-brice",
  display: "swap",
});

const mundial = localFont({
  src: [
    { path: "../public/fonts/Mundial-Regular.otf", weight: "400" },
    { path: "../public/fonts/MundialDemibold.otf", weight: "600" },
    { path: "../public/fonts/Mundial-Bold.otf", weight: "700" },
  ],
  variable: "--font-mundial",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: siteMetadataBase(),
  title: "VIBE NIGHT",
  description:
    "Good Vibes Club game night — six arcade titles, one account, shared leaderboards, and Vibe Night passports.",
  icons: {
    icon: "/shaka.png",
    apple: "/shaka.png",
  },
  openGraph: {
    title: "VIBE NIGHT",
    description: "Good Vibes Club game night — play, compete, collect badges.",
    url: absoluteUrl("/"),
    siteName: "Vibe Night",
    images: [{ url: absoluteUrl("/api/og/score?game=Vibe+Night&name=Player&score=0"), width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VIBE NIGHT",
    description: "Good Vibes Club game night — six arcade titles, one account.",
    images: [absoluteUrl("/api/og/score?game=Vibe+Night&name=Player&score=0")],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-gvc-black">
      <body className={`${brice.variable} ${mundial.variable} font-body`}>
        <SiteBackdrop />
        <VibeNightShell>
          <div className="relative z-[1] min-h-[100dvh]">{children}</div>
        </VibeNightShell>
        <div className="relative z-[100]">
          <Toaster
            position="bottom-center"
            toastOptions={{
              style: {
                background: "#1F1F1F",
                color: "#ffffff",
                border: "1px solid rgba(255, 224, 72, 0.2)",
                borderRadius: "12px",
                fontSize: "14px",
              },
            }}
          />
        </div>
      </body>
    </html>
  );
}
