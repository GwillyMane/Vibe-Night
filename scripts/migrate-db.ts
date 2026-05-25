/**
 * Run once per deploy: `npm run migrate`
 */
import { config } from "dotenv";
import { resolve } from "node:path";

async function main() {
  config({ path: resolve(process.cwd(), ".env.local") });

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set. Add it to .env.local first.");
    process.exit(1);
  }

  process.env.ALLOW_RUNTIME_MIGRATIONS = "true";

  const { ensureTables, getPool } = await import("../lib/db");

  await ensureTables();
  const pool = getPool();
  if (pool) await pool.query("SELECT 1");
  console.log("Database schema is ready.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
