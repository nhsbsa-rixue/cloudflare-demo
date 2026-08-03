import { DatabaseError, Err, type Result } from './types';

/**
 * Run a database operation, converting any thrown error into a typed
 * `DatabaseError` Result. The operation itself returns a `Result`, so callers
 * can still return domain errors (e.g. "not found") without throwing.
 */
export async function runQuery<T>(
  message: string,
  code: string,
  operation: () => Promise<Result<T>>
): Promise<Result<T>> {
  try {
    return await operation();
  } catch (error) {
    return Err(new DatabaseError(message, code, error));
  }
}

/** Minimal shape of a Drizzle query builder that supports pagination. */
interface Paginatable<Q> {
  limit(value: number): Q;
  offset(value: number): Q;
}

/**
 * Apply optional `limit`/`offset` to a dynamic query. Mirrors the historical
 * truthy behavior: zero (or missing) values are skipped.
 */
export function applyPagination<Q extends Paginatable<Q>>(query: Q, options?: { limit?: number; offset?: number }): Q {
  let next = query;
  if (options?.limit) {
    next = next.limit(options.limit);
  }
  if (options?.offset) {
    next = next.offset(options.offset);
  }
  return next;
}
