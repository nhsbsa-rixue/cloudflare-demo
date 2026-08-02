export interface Env {
  UPLOADS_BUCKET: R2Bucket;
  UPLOADS_DB: D1Database;
  'x-api-key'?: string;
  UPLOAD_API_KEY?: string;
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

export interface ListCasesOptions {
  statuses?: Array<'draft' | 'active' | 'completed' | 'archived'>;
  userId?: string;
  search?: string;
  limit?: number;
  offset?: number;
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
  role?: 'admin' | 'user' | 'operator' | 'editor' | 'guest';
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
