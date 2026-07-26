import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';

/**
 * Shared Drizzle database type used by all helpers.
 *
 * `BaseSQLiteDatabase` is the common base of both `DrizzleD1Database` (async, production)
 * and `BetterSQLite3Database` (sync, local dev), so helpers stay type-safe across environments.
 */
export type AppDatabase = BaseSQLiteDatabase<'sync' | 'async', unknown>;

/**
 * Result type for database operations - allows type-safe error handling
 */
export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

export function Ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function Err<E>(error: E): Result<never, E> {
  return { ok: false, error } as Result<never, E>;
}

/**
 * Database operation options
 */
export interface DbOperationOptions {
  transaction?: boolean;
}

/**
 * Filter options for queries
 */
export interface FilterOptions<T> {
  limit?: number;
  offset?: number;
  orderBy?: Array<{ column: keyof T; direction: 'asc' | 'desc' }>;
}

/**
 * Database error type
 */
export class DatabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}
