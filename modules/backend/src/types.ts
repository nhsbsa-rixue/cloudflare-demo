export interface Env {
  UPLOADS_BUCKET: R2Bucket;
  UPLOADS_DB: D1Database;
}

export interface CreateCaseInput {
  id: string;
  userId: string;
  imageUrl: string;
  type: 'cnc' | '3d' | 'other';
  status?: 'draft' | 'active' | 'completed' | 'archived';
}

export interface GetUserCasesOptions {
  limit?: number;
  offset?: number;
  status?: 'draft' | 'active' | 'completed' | 'archived';
}

export interface UpdateCaseInput {
  userId?: string;
  imageUrl?: string;
  type?: 'cnc' | '3d' | 'other';
  status?: 'draft' | 'active' | 'completed' | 'archived';
}

export interface CreateUserInput {
  name: string;
  email: string;
  role?: 'admin' | 'user' | 'editor';
}

export interface GetAllUsersOptions {
  limit?: number;
  offset?: number;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: 'admin' | 'user' | 'editor';
  emailVerifiedAt?: Date | null;
}
