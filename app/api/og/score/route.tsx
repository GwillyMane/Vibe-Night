import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name") ?? "Player";
  const score = searchParams.get("score") ?? "0";
  const game = searchParams.get("game") ?? "Vibe Night";
  const mode = searchParams.get("mode");

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#050505",
          color: "#FFE048",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 28, opacity: 0.6, letterSpacing: 8 }}>GOOD VIBES CLUB</div>
        <div style={{ fontSize: 36, marginTop: 12, textTransform: "uppercase" }}>{game}</div>
        <div style={{ fontSize: 32, marginTop: 8, color: "#ffffff", opacity: 0.85 }}>{name}</div>
        <div style={{ fontSize: 120, fontWeight: 900, marginTop: 16 }}>{score}</div>
        {mode ? (
          <div style={{ fontSize: 24, marginTop: 8, color: "#FF6B9D", textTransform: "uppercase" }}>{mode}</div>
        ) : null}
        <div style={{ fontSize: 22, marginTop: 24, opacity: 0.5 }}>VIBE NIGHT</div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
