import path from "path";
import type { Database } from "better-sqlite3";

export const DB_PATH = path.join(
  process.cwd(),
  "pipeline",
  "data",
  "ceos.db"
);

/**
 * Opens the pipeline SQLite database synchronously.
 * Returns null if the DB file does not exist yet.
 * Always close the returned handle after use.
 */
export function openDb(readonly = true): Database | null {
  // Dynamic require keeps the native module out of the client bundle.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const BetterSQLite3 = require("better-sqlite3") as typeof import("better-sqlite3");
  try {
    return new BetterSQLite3(DB_PATH, { readonly });
  } catch {
    return null;
  }
}
