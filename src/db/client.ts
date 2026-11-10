import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export type Db = ReturnType<typeof createDb>["db"];

/** Creates a database connection. Call close() when done (tests, scripts). */
export function createDb(url = process.env.DATABASE_URL) {
  if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local.");
  const pool = new Pool({ connectionString: url });
  const db = drizzle({ client: pool, schema });
  return { db, close: () => pool.end() };
}

let shared: ReturnType<typeof createDb> | undefined;

/** The app-wide connection, created on first use. */
export function getDb(): Db {
  shared ??= createDb();
  return shared.db;
}
