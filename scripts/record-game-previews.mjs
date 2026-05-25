/**
 * Records canvas-only preview clips for each arcade game.
 *
 * Usage: npm run record:previews
 * Requires dev server at BASE_URL (default http://localhost:3000).
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "games");
const BASE_URL = process.env.PREVIEW_BASE_URL ?? "http://localhost:3000";
const RECORD_MS = Number(process.env.PREVIEW_RECORD_MS ?? 18_000);

const GAMES = [
  { id: "vibe-crashers", route: "/vibe-crashers", png: "vibe-crashers-preview.png", webm: "vibe-crashers-preview.webm", start: "Play" },
  { id: "vibe-merge", route: "/vibe-merge", png: "big-vibes-preview.png", webm: "big-vibes-preview.webm", start: "Play" },
  { id: "vibe-garden", route: "/vibe-garden", png: "vibe-garden-preview.png", webm: "vibe-garden-preview.webm", start: "Classic garden" },
  { id: "catch-a-vibe", route: "/catch-a-vibe", png: "catch-a-vibe-preview.png", webm: "catch-a-vibe-preview.webm", start: "Classic catch" },
  { id: "vibe-shift", route: "/vibe-shift", png: "vibe-shift-preview.png", webm: "vibe-shift-preview.webm", start: "Classic shift" },
  { id: "lucky-vibes", route: "/lucky-vibes", png: "lucky-vibes-preview.png", webm: "lucky-vibes-preview.webm", start: "Classic run" },
];

const ONBOARD_GAMES = ["vibe-crashers", "vibe-merge", "vibe-garden", "catch-a-vibe", "vibe-shift", "lucky-vibes"];

async function seedBrowserState(page) {
  await page.addInitScript((gameIds) => {
    for (const id of gameIds) {
      localStorage.setItem(`vibe-night:onboarded:${id}`, "1");
    }
    localStorage.setItem("sound-muted", "1");
    localStorage.setItem("vibe-shift:persisted", JSON.stringify({ soundMuted: true, achievements: [] }));
    localStorage.setItem("lucky-vibes:persisted", JSON.stringify({ soundMuted: true, achievements: [] }));
    localStorage.setItem("vibe-merge:persisted", JSON.stringify({ soundMuted: true, achievements: [] }));
    localStorage.setItem("vibe-garden:persisted", JSON.stringify({ soundMuted: true, achievements: [] }));
    localStorage.setItem("catch-a-vibe:persisted", JSON.stringify({ soundMuted: true, achievements: [] }));
  }, ONBOARD_GAMES);
}

async function waitForMainCanvas(page) {
  await page.waitForFunction(() => {
    const canvases = [...document.querySelectorAll("canvas")].filter((c) => {
      const r = c.getBoundingClientRect();
      return r.width >= 120 && r.height >= 120;
    });
    return canvases.length > 0;
  }, { timeout: 60_000 });
}

async function mainCanvasBox(page) {
  return page.evaluate(() => {
    const canvas = [...document.querySelectorAll("canvas")]
      .map((c) => ({ c, area: c.getBoundingClientRect().width * c.getBoundingClientRect().height }))
      .filter((x) => x.area > 14_000)
      .sort((a, b) => b.area - a.area)[0]?.c;
    if (!canvas) throw new Error("No canvas found");
    const r = canvas.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, width: r.width, height: r.height };
  });
}

async function recordCanvasBytes(page, durationMs) {
  return page.evaluate(async (duration) => {
    const canvas = [...document.querySelectorAll("canvas")]
      .map((c) => ({ c, area: c.getBoundingClientRect().width * c.getBoundingClientRect().height }))
      .filter((x) => x.area > 14_000)
      .sort((a, b) => b.area - a.area)[0]?.c;
    if (!canvas) throw new Error("No canvas for recording");

    const fps = 30;
    const stream = canvas.captureStream(fps);
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 4_000_000 });
    const chunks = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    const bytes = await new Promise((resolve, reject) => {
      recorder.onerror = () => reject(new Error("MediaRecorder failed"));
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: mimeType });
        const buf = await blob.arrayBuffer();
        resolve(Array.from(new Uint8Array(buf)));
      };
      recorder.start(250);
      window.setTimeout(() => recorder.stop(), duration);
    });

    return bytes;
  }, durationMs);
}

async function dismissCoachIfVisible(page) {
  const gotIt = page.getByRole("button", { name: /got it|next|start|let's go|continue/i });
  for (let i = 0; i < 6; i++) {
    if (!(await gotIt.first().isVisible().catch(() => false))) break;
    await gotIt.first().click();
    await page.waitForTimeout(400);
  }
}

async function runDemo(page, gameId) {
  const box = await mainCanvasBox(page);
  const { x, y, width, height } = box;

  switch (gameId) {
    case "vibe-crashers": {
      for (let i = 0; i < 3; i++) {
        await page.mouse.move(x - width * 0.15, y + height * 0.1);
        await page.mouse.down();
        await page.mouse.move(x + width * 0.1, y - height * 0.05, { steps: 12 });
        await page.waitForTimeout(300);
        await page.mouse.up();
        await page.waitForTimeout(2200);
      }
      break;
    }
    case "vibe-merge": {
      for (let i = 0; i < 14; i++) {
        await page.mouse.click(x + (Math.random() - 0.5) * width * 0.35, y - height * 0.05);
        await page.waitForTimeout(900);
      }
      break;
    }
    case "vibe-garden": {
      for (let i = 0; i < 12; i++) {
        const px = x + (Math.random() - 0.5) * width * 0.7;
        const py = y + (Math.random() - 0.5) * height * 0.5;
        await page.mouse.click(px, py);
        await page.waitForTimeout(1100);
      }
      break;
    }
    case "catch-a-vibe": {
      for (let i = 0; i < 8; i++) {
        const sx = x - width * 0.25;
        const sy = y + height * 0.1;
        const ex = x + width * 0.25;
        const ey = y - height * 0.15;
        await page.mouse.move(sx, sy);
        await page.mouse.down();
        await page.mouse.move(ex, ey, { steps: 16 });
        await page.mouse.up();
        await page.waitForTimeout(1400);
      }
      break;
    }
    case "vibe-shift": {
      for (let i = 0; i < 5; i++) {
        const rowY = y - height * 0.2 + (i % 3) * (height * 0.15);
        await page.mouse.move(x - width * 0.3, rowY);
        await page.mouse.down();
        await page.mouse.move(x + width * 0.3, rowY, { steps: 18 });
        await page.waitForTimeout(200);
        await page.mouse.up();
        await page.waitForTimeout(1800);
      }
      break;
    }
    default:
      break;
  }
}

async function recordGame(browser, game) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    recordVideo: undefined,
  });
  const page = await context.newPage();
  await seedBrowserState(page);

  console.log(`\n▶ ${game.id} → ${game.route}`);
  await page.goto(`${BASE_URL}${game.route}`, { waitUntil: "networkidle", timeout: 90_000 });
  await page.waitForTimeout(2500);

  const startBtn = page.getByRole("button", { name: game.start, exact: true });
  await startBtn.waitFor({ state: "visible", timeout: 60_000 });
  await startBtn.click();
  await page.waitForTimeout(1500);
  await dismissCoachIfVisible(page);
  await waitForMainCanvas(page);
  await page.waitForTimeout(1200);

  const canvas = page.locator("canvas").first();
  const pngPath = path.join(OUT_DIR, game.png);
  await canvas.screenshot({ path: pngPath, type: "png" });
  console.log(`  ✓ poster ${game.png}`);

  const recordPromise = recordCanvasBytes(page, RECORD_MS);
  await page.waitForTimeout(800);
  await runDemo(page, game.id);
  const bytes = await recordPromise;

  const webmPath = path.join(OUT_DIR, game.webm);
  fs.writeFileSync(webmPath, Buffer.from(bytes));
  console.log(`  ✓ video  ${game.webm} (${(bytes.length / 1024).toFixed(0)} KB)`);

  await context.close();
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  try {
    const probe = await fetch(BASE_URL);
    if (probe.status >= 500) throw new Error(`HTTP ${probe.status}`);
  } catch (e) {
    console.error(`Dev server not reachable at ${BASE_URL}. Start with: npm run dev`);
    if (e instanceof Error && e.message.startsWith("HTTP")) console.error(e.message);
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const only = process.env.PREVIEW_GAME;
  const queue = only ? GAMES.filter((g) => g.id === only) : GAMES;
  if (!queue.length) {
    console.error(`Unknown PREVIEW_GAME=${only}`);
    process.exit(1);
  }

  for (const game of queue) {
    try {
      await recordGame(browser, game);
    } catch (err) {
      console.error(`  ✗ failed ${game.id}:`, err instanceof Error ? err.message : err);
    }
  }

  await browser.close();
  console.log("\nDone.");
}

main();
