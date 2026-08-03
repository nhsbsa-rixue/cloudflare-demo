export interface Env {
  UPLOADS_BUCKET: R2Bucket;
  UPLOADS_DB: D1Database;
  'x-api-key'?: string;
  UPLOAD_API_KEY?: string;
}

/** Case classification. */
export type CaseType = 'cnc' | '3d' | 'other';

/** Lifecycle status persisted for a case. */
export type CaseStatus = 'draft' | 'active' | 'completed' | 'archived';

/** App roles persisted in the users table. */
export type UserRole = 'admin' | 'user' | 'operator' | 'editor' | 'guest';

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
