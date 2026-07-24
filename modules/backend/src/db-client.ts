import { drizzle } from 'drizzle-orm/d1';
import { getDatabaseHelper } from '@cloudflare-demo/database';
import type { DatabaseHelper } from '@cloudflare-demo/database';
import type { Env } from './types';

/**
 * Initialize and return a combined DatabaseHelper instance for D1
 * Provides access to users and cases helpers
 */
export function initializeDatabaseClient(env: Env): DatabaseHelper {
  const drizzleDb = drizzle(env.UPLOADS_DB);
  return getDatabaseHelper(drizzleDb);
}
