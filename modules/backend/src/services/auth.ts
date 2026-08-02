const VALID_ROLES = new Set(['admin', 'user', 'operator', 'editor', 'guest']);

export type AppRole = 'admin' | 'user' | 'operator' | 'editor' | 'guest';

export interface AuthenticatedActor {
  id: string;
  email: string;
  name: string;
  role: AppRole;
}

export function normalizeRole(value: string | null | undefined): AppRole {
  return value && VALID_ROLES.has(value) ? (value as AppRole) : 'user';
}
