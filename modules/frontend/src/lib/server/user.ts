/**
 * Pure helpers for resolving the authenticated app user in server loads.
 *
 * Deliberately free of `$app/*` imports so it can be unit-tested in isolation.
 */
import type { AppUserRole, AuthenticatedUser, WorkerAuthMeResponse } from '$lib/types';

const VALID_ROLES: ReadonlySet<string> = new Set(['admin', 'user', 'operator', 'editor', 'guest']);

/** Coerce an arbitrary role string to a known app role, defaulting to `user`. */
export function normalizeUserRole(value: string | null | undefined): AppUserRole {
  return value && VALID_ROLES.has(value) ? (value as AppUserRole) : 'user';
}

/** Derive a human display name from the local part of an email address. */
export function displayNameFromEmail(email: string): string {
  const [localPart = email] = email.split('@');
  return localPart.replace(/[._-]+/g, ' ');
}

/** Safe fallback user used when the worker is unreachable or errors. */
export function fallbackUser(email: string): AuthenticatedUser {
  return { id: null, email, name: displayNameFromEmail(email), role: 'user' };
}

/** Map a worker `/api/auth/me` user payload into the app's AuthenticatedUser. */
export function resolveWorkerUser(user: WorkerAuthMeResponse['user']): AuthenticatedUser {
  return { id: user.id, email: user.email, name: user.name, role: normalizeUserRole(user.role) };
}
