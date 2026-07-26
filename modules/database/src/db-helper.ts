import { UsersHelper } from './users';
import { CasesHelper } from './cases';
import type { AppDatabase } from './types';

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
export function getDatabaseHelper(db: AppDatabase): DatabaseHelper {
  return {
    users: new UsersHelper(db),
    cases: new CasesHelper(db)
  };
}
