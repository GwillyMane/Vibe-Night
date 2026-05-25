import { Pool, type PoolClient } from "pg";

let pool: Pool | null = null;
let ensureTablesPromise: Promise<void> | null = null;

export function getPool(): Pool | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!pool) {
    const max = process.env.NODE_ENV === "production" ? 4 : 8;
    pool = new Pool({ connectionString: url, max, idleTimeoutMillis: 20_000, connectionTimeoutMillis: 10_000 });
  }
  return pool;
}

export function dbAvailable(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/** Calendar day start in America/New_York as timestamptz (for SQL fragments). */
export const sqlNyDayStart = `(date_trunc('day', now() AT TIME ZONE 'America/New_York') AT TIME ZONE 'America/New_York')`;

/** ISO week start (Monday) in America/New_York as timestamptz. */
export const sqlNyWeekStart = `(date_trunc('week', now() AT TIME ZONE 'America/New_York') AT TIME ZONE 'America/New_York')`;

const allowRuntimeMigrations =
  process.env.ALLOW_RUNTIME_MIGRATIONS === "true" || process.env.NODE_ENV === "development";

/** Idempotent DDL — run via `npm run migrate` in production; dev runs on first API hit. */
export async function ensureTables(): Promise<void> {
  if (!allowRuntimeMigrations) return;
  const p = getPool();
  if (!p) throw new Error("DATABASE_URL is not configured");
  if (ensureTablesPromise) return ensureTablesPromise;

  ensureTablesPromise = (async () => {
    const c = await p.connect();
    try {
      await c.query("BEGIN");
      await c.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      await c.query(`
        CREATE TABLE IF NOT EXISTS sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          session_token_hash TEXT UNIQUE NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          last_seen_at TIMESTAMPTZ
        );
      `);
      await c.query(`
        CREATE TABLE IF NOT EXISTS leaderboard_scores (
          id BIGSERIAL PRIMARY KEY,
          user_id UUID REFERENCES users(id) ON DELETE SET NULL,
          username TEXT NOT NULL,
          mode TEXT NOT NULL,
          level_id TEXT NOT NULL,
          seed TEXT,
          score INTEGER NOT NULL,
          stars INTEGER NOT NULL DEFAULT 0,
          shots_used INTEGER NOT NULL DEFAULT 0,
          shots_total INTEGER NOT NULL DEFAULT 0,
          moves_json TEXT,
          run_hash TEXT,
          client_version TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      await c.query(`
        CREATE TABLE IF NOT EXISTS user_level_progress (
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          level_id TEXT NOT NULL,
          best_score INTEGER NOT NULL DEFAULT 0,
          best_stars INTEGER NOT NULL DEFAULT 0,
          best_shots_used INTEGER,
          completed BOOLEAN NOT NULL DEFAULT FALSE,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (user_id, level_id)
        );
      `);
      await c.query(`
        CREATE TABLE IF NOT EXISTS user_daily_progress (
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          daily_seed TEXT NOT NULL,
          level_id TEXT NOT NULL,
          best_score INTEGER NOT NULL DEFAULT 0,
          best_stars INTEGER NOT NULL DEFAULT 0,
          best_shots_used INTEGER,
          completed BOOLEAN NOT NULL DEFAULT FALSE,
          played_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (user_id, daily_seed)
        );
      `);
      await c.query(`
        CREATE TABLE IF NOT EXISTS user_achievements (
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          achievement_id TEXT NOT NULL,
          unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (user_id, achievement_id)
        );
      `);
      await c.query(`
        CREATE TABLE IF NOT EXISTS user_goals (
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          goal_id TEXT NOT NULL,
          progress INTEGER NOT NULL DEFAULT 0,
          completed BOOLEAN NOT NULL DEFAULT FALSE,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (user_id, goal_id)
        );
      `);
      await c.query(`
        CREATE TABLE IF NOT EXISTS user_settings (
          user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          selected_projectile TEXT,
          sound_muted BOOLEAN NOT NULL DEFAULT FALSE,
          reduced_motion BOOLEAN,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await c.query(`
        CREATE TABLE IF NOT EXISTS user_profiles (
          user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          equipped_title_id TEXT NOT NULL DEFAULT 'vibe-night-regular',
          featured_badge_key TEXT,
          avatar_face_id TEXT NOT NULL DEFAULT 'shaka',
          favorite_game_id TEXT,
          theme_id TEXT NOT NULL DEFAULT 'midnight',
          border_id TEXT NOT NULL DEFAULT 'gold-ring',
          glow_id TEXT NOT NULL DEFAULT 'gold',
          background_id TEXT NOT NULL DEFAULT 'embers',
          particle_id TEXT NOT NULL DEFAULT 'gold-drift',
          vibe_rank INTEGER NOT NULL DEFAULT 0,
          arcade_tier TEXT NOT NULL DEFAULT 'Rookie',
          last_active_at TIMESTAMPTZ,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      await c.query(`
        CREATE TABLE IF NOT EXISTS user_streaks (
          user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          current_streak INTEGER NOT NULL DEFAULT 0,
          longest_streak INTEGER NOT NULL DEFAULT 0,
          last_play_date DATE,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      await c.query(`
        CREATE TABLE IF NOT EXISTS user_titles (
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title_id TEXT NOT NULL,
          unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (user_id, title_id)
        );
      `);
      await c.query(`
        CREATE TABLE IF NOT EXISTS user_unlocked_cosmetics (
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          cosmetic_type TEXT NOT NULL,
          cosmetic_id TEXT NOT NULL,
          unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (user_id, cosmetic_type, cosmetic_id)
        );
      `);
      await c.query(`
        CREATE TABLE IF NOT EXISTS user_pinned_badges (
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          slot INTEGER NOT NULL,
          badge_key TEXT NOT NULL,
          pinned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (user_id, slot)
        );
      `);
      await c.query(`
        CREATE TABLE IF NOT EXISTS user_game_stats (
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          game_id TEXT NOT NULL,
          stats_json JSONB NOT NULL DEFAULT '{}',
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (user_id, game_id)
        );
      `);
      await c.query(`
        CREATE TABLE IF NOT EXISTS user_activity (
          id BIGSERIAL PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          kind TEXT NOT NULL,
          payload JSONB NOT NULL DEFAULT '{}',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await c.query(`CREATE INDEX IF NOT EXISTS idx_lb_mode_created_score ON leaderboard_scores (mode, created_at DESC, score DESC);`);
      await c.query(`CREATE INDEX IF NOT EXISTS idx_lb_level_score ON leaderboard_scores (level_id, score DESC);`);
      await c.query(`CREATE INDEX IF NOT EXISTS idx_lb_seed_score ON leaderboard_scores (seed, score DESC);`);
      await c.query(`CREATE INDEX IF NOT EXISTS idx_lb_user_created ON leaderboard_scores (user_id, created_at DESC);`);

      await c.query(`
        ALTER TABLE leaderboard_scores
        ADD COLUMN IF NOT EXISTS game_id TEXT NOT NULL DEFAULT 'vibe-crashers';
      `);
      await c.query(`
        CREATE INDEX IF NOT EXISTS idx_lb_game_mode_created ON leaderboard_scores (game_id, mode, created_at DESC, score DESC);
      `);
      await c.query(`CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id);`);
      await c.query(`CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions (expires_at);`);

      // Legacy installs: drop email column (accounts are username + password only).
      await c.query(`ALTER TABLE users DROP COLUMN IF EXISTS email;`);

      // Profile system: add game_id to achievements/goals for cross-game identity.
      await c.query(`ALTER TABLE user_achievements ADD COLUMN IF NOT EXISTS game_id TEXT NOT NULL DEFAULT 'vibe-crashers';`);
      await c.query(`ALTER TABLE user_goals ADD COLUMN IF NOT EXISTS game_id TEXT NOT NULL DEFAULT 'vibe-crashers';`);
      await c.query(`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS passport_url TEXT;`);
      await c.query(`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS passport_generated_at TIMESTAMPTZ;`);
      await c.query(`
        DO $$ BEGIN
          IF EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'user_achievements_pkey'
              AND conrelid = 'user_achievements'::regclass
          ) AND NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE table_name = 'user_achievements' AND constraint_type = 'PRIMARY KEY'
              AND constraint_name LIKE '%game%'
          ) THEN
            ALTER TABLE user_achievements DROP CONSTRAINT user_achievements_pkey;
            ALTER TABLE user_achievements ADD PRIMARY KEY (user_id, game_id, achievement_id);
          END IF;
        END $$;
      `);
      await c.query(`
        DO $$ BEGIN
          IF EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'user_goals_pkey'
              AND conrelid = 'user_goals'::regclass
          ) AND NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE table_name = 'user_goals' AND constraint_type = 'PRIMARY KEY'
              AND constraint_name LIKE '%game%'
          ) THEN
            ALTER TABLE user_goals DROP CONSTRAINT user_goals_pkey;
            ALTER TABLE user_goals ADD PRIMARY KEY (user_id, game_id, goal_id);
          END IF;
        END $$;
      `);

      await c.query(`CREATE INDEX IF NOT EXISTS idx_user_activity_user_created ON user_activity (user_id, created_at DESC);`);
      await c.query(`CREATE INDEX IF NOT EXISTS idx_user_achievements_game ON user_achievements (user_id, game_id);`);
      await c.query(`CREATE INDEX IF NOT EXISTS idx_user_game_stats_user ON user_game_stats (user_id);`);

      await c.query("COMMIT");
    } catch (e) {
      await c.query("ROLLBACK").catch(() => undefined);
      ensureTablesPromise = null;
      throw e;
    } finally {
      c.release();
    }
  })();

  return ensureTablesPromise;
}

export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const p = getPool();
  if (!p) throw new Error("DATABASE_URL is not configured");
  const c = await p.connect();
  try {
    await c.query("BEGIN");
    const out = await fn(c);
    await c.query("COMMIT");
    return out;
  } catch (e) {
    await c.query("ROLLBACK").catch(() => undefined);
    throw e;
  } finally {
    c.release();
  }
}
