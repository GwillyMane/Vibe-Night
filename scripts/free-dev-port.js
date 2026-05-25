/**
 * Stops whatever is LISTENING on port 3000 (usually a stale `next dev`).
 * Prevents the browser from hitting an old server while a new dev run uses another port,
 * which causes 404s on /_next/static/chunks/main-app.js and app-pages-internals.js.
 *
 * Windows: PowerShell + Get-NetTCPConnection. Unix: `fuser` when available.
 */
const { execSync } = require("child_process");

const PORT = process.env.DEV_PORT || "3000";

function main() {
  if (process.platform === "win32") {
    const ps = [
      "Get-NetTCPConnection",
      `-LocalPort ${PORT}`,
      "-State Listen",
      "-ErrorAction SilentlyContinue",
      "| ForEach-Object {",
      "Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue",
      "}",
    ].join(" ");
    try {
      execSync(`powershell -NoProfile -Command "${ps}"`, { stdio: "inherit" });
      console.log(`[free-dev-port] Attempted to free port ${PORT} (ignore errors if port was already free).`);
    } catch {
      console.warn("[free-dev-port] PowerShell step exited non-zero (often harmless if port was free).");
    }
    return;
  }

  try {
    execSync(`fuser -k ${PORT}/tcp`, { stdio: "inherit" });
    console.log(`[free-dev-port] fuser cleared port ${PORT}`);
  } catch {
    console.log(`[free-dev-port] Port ${PORT} — fuser not available or nothing to kill (ok)`);
  }
}

main();
