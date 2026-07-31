import { error, redirect, type Handle } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { getAuthenticatedEmailFromRequest } from '$lib/server/auth';

const PROTECTED_PATH_PREFIXES = ['/upload', '/dashboard', '/api/files', '/design'];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.authenticatedEmail = getAuthenticatedEmailFromRequest(event.request);

  if (!event.locals.authenticatedEmail && isProtectedPath(event.url.pathname)) {
    if (dev) {
      redirect(303, '/dev-login');
    }
    throw error(401, 'Authentication required');
  }

  return resolve(event);
};
