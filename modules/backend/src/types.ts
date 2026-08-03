export interface Env {
  UPLOADS_BUCKET: R2Bucket;
  UPLOADS_DB: D1Database;
  'x-api-key'?: string;
  UPLOAD_API_KEY?: string;
}

/** Case classification. Single source for both the runtime list and the type. */
export const CASE_TYPES = ['cnc', '3d', 'other'] as const;
export type CaseType = (typeof CASE_TYPES)[number];

/** Lifecycle status persisted for a case. */
export const CASE_STATUSES = ['draft', 'active', 'completed', 'archived'] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];

/** App roles persisted in the users table. */
export const USER_ROLES = ['admin', 'user', 'operator', 'editor', 'guest'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface CreateCaseInput {
  id: string;
  userId: string;
  imageUrl: string;
  type: CaseType;
  status?: CaseStatus;
}

export interface GetUserCasesOptions {
  limit?: number;
  offset?: number;
  status?: CaseStatus;
}

export interface ListCasesOptions {
  statuses?: Array<CaseStatus>;
  userId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface UpdateCaseInput {
  userId?: string;
  imageUrl?: string;
  type?: CaseType;
  status?: CaseStatus;
}

export interface CreateUserInput {
  name: string;
  email: string;
  role?: UserRole;
}

export interface GetAllUsersOptions {
  limit?: number;
  offset?: number;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: 'admin' | 'user' | 'operator' | 'editor';
  emailVerifiedAt?: Date | null;
}
