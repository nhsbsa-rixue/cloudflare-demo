import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { Database } from "better-sqlite3";

import { UsersHelper } from "./users";
import { CasesHelper } from "./cases";

/**
 * Combined DatabaseHelper interface - exposes all modules
 */
export interface DatabaseHelper {
  users: UsersHelper;
  cases: CasesHelper;
}

/**
 * Initialize and return a combined DatabaseHelper instance
 * This factory function should be called in route handlers or worker entry points
 */
export function getDatabaseHelper(
  db: DrizzleD1Database | Database
): DatabaseHelper {
  return {
    users: new UsersHelper(db),
    cases: new CasesHelper(db),
  };
}
