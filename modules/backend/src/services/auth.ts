import { CASE_STATUSES, USER_ROLES, type CaseStatus, type UserRole } from '../types';

export type AppRole = UserRole;

const VALID_ROLES = new Set<string>(USER_ROLES);
const OPERATOR_ROLES = new Set<AppRole>(['admin', 'operator', 'editor']);

export interface AuthenticatedActor {
  id: string;
  email: string;
  name: string;
  role: AppRole;
}

export function normalizeRole(value: string | null | undefined): AppRole {
  return value && VALID_ROLES.has(value) ? (value as AppRole) : 'user';
}

/** Operator-class roles can see all cases and act on behalf of any user. */
export function isOperatorRole(role: AppRole): boolean {
  return OPERATOR_ROLES.has(role);
}

/** Statuses a role may view by default: operators see everything, others don't see archived. */
export function defaultStatusesForRole(role: AppRole): CaseStatus[] {
  if (isOperatorRole(role)) {
    return [...CASE_STATUSES];
  }
  return ['draft', 'active', 'completed'];
}
