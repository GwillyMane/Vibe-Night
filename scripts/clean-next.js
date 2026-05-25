/**
 * Remove Next.js caches that often go stale on Windows (missing ./NNN.js chunk errors).
 * Run: npm run clean   then restart dev server.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

function rm(p) {
  const abs = path.join(root, p);
  try {
    fs.rmSync(abs, { recursive: true, force: true });
    console.log("removed", p);
  } catch (e) {
    console.warn("skip", p, e.message);
  }
}

rm(".next");
rm("node_modules/.cache");
