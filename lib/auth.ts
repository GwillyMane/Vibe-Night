import type { Pool } from "pg";
import { hashPassword, verifyPassword } from "./password";

export interface RegisterInput {
  username: string;
  password: string;
}

const USERNAME_RE = /^[a-zA-Z0-9_]{3,24}$/;

export function validateUsername(username: string): string | null {
  const t = username.trim();
  if (!USERNAME_RE.test(t)) return "Username must be 3–24 characters (letters, numbers, underscore).";
  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (password.length > 200) return "Password is too long.";
  return null;
}

export async function registerUser(pool: Pool, input: RegisterInput): Promise<{ user: { id: string; username: string; created_at: string } } | { error: string; code: string }> {
  const uErr = validateUsername(input.username);
  if (uErr) return { error: uErr, code: "validation" };
  const pErr = validatePassword(input.password);
  if (pErr) return { error: pErr, code: "validation" };

  const username = input.username.trim();

  const dup = await pool.query(`SELECT 1 FROM users WHERE lower(username) = lower($1) LIMIT 1`, [username]);
  if (dup.rowCount) {
    return { error: "That username is already taken.", code: "duplicate" };
  }

  const password_hash = await hashPassword(input.password);
  try {
    const { rows } = await pool.query<{ id: string; username: string; created_at: Date }>(
      `INSERT INTO users (username, password_hash)
       VALUES ($1, $2)
       RETURNING id, username, created_at`,
      [username, password_hash]
    );
    const row = rows[0]!;
    return {
      user: {
        id: row.id,
        username: row.username,
        created_at: new Date(row.created_at).toISOString(),
      },
    };
  } catch {
    return { error: "Could not create account.", code: "server" };
  }
}

export async function loginUser(
  pool: Pool,
  username: string,
  password: string
): Promise<{ user: { id: string; username: string; created_at: string } } | { error: string }> {
  const name = username.trim();
  if (!name || !password) return { error: "Invalid credentials" };

  const { rows } = await pool.query<{ id: string; username: string; password_hash: string; created_at: Date }>(
    `SELECT id, username, password_hash, created_at FROM users
     WHERE lower(username) = lower($1)
     LIMIT 2`,
    [name]
  );
  if (rows.length !== 1) return { error: "Invalid credentials" };
  const row = rows[0]!;
  const ok = await verifyPassword(password, row.password_hash);
  if (!ok) return { error: "Invalid credentials" };
  return {
    user: {
      id: row.id,
      username: row.username,
      created_at: new Date(row.created_at).toISOString(),
    },
  };
}
