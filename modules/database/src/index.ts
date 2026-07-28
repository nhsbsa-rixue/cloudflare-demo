// Re-export all types and utilities
export {
  DatabaseError,
  Ok,
  Err,
  type Result,
  type DbOperationOptions,
  type FilterOptions,
  type AppDatabase
} from './types';

// Re-export users module
export { users, type User, type NewUser, UsersHelper } from './users';

// Re-export cases module
export {
  cases,
  type Case,
  type NewCase,
  CasesHelper,
  type CaseStatus,
  type CaseWithUser,
  type GetCasesWithUserOptions
} from './cases';

// Re-export OAuth accounts module
export {
  authAccounts,
  type AuthAccount,
  type NewAuthAccount
} from './auth-accounts';

// Re-export combined database helper factory
export { getDatabaseHelper, type DatabaseHelper } from './db-helper';
