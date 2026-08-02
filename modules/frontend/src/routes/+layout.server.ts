import { dev } from '$app/environment';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { buildForwardedAuthHeaders, displayNameFromEmail } from '$lib/server/auth';
import type { AppUserRole, WorkerAuthMeResponse } from '$lib/types';

const WORKER_AUTH_ME_URL = 'http://127.0.0.1:8787/api/auth/me';

// Pages that do not require a whitelisted D1 account.
const PUBLIC_PATHS = new Set(['/', '/about', '/access-denied']);

const VALID_ROLES: ReadonlySet<string> = new Set(['admin', 'user', 'operator', 'editor', 'guest']);

function normalizeRole(value: string | null | undefined): AppUserRole {
  if (value && VALID_ROLES.has(value)) {
    return value as AppUserRole;
  }
  return 'user';
}

export const load: LayoutServerLoad = async ({ request, platform, fetch, locals, url }) => {
  const email = locals.authenticatedEmail;

  if (!email) {
    return {
      authenticatedUser: null
    };
  }

  if (!dev && !platform?.env?.WORKER) {
    return {
      authenticatedUser: {
        id: null,
        email,
        name: displayNameFromEmail(email),
        role: 'user' as AppUserRole
      }
    };
  }

  try {
    const headers = buildForwardedAuthHeaders(request);
    const response = dev
      ? await fetch(WORKER_AUTH_ME_URL, { headers })
      : await platform?.env?.WORKER?.fetch(WORKER_AUTH_ME_URL, { headers });

    if (!response || !response.ok) {
      if (response?.status === 403 && url.pathname !== '/access-denied') {
        redirect(303, '/access-denied');
      }
      return {
        authenticatedUser: {
          id: null,
          email,
          name: displayNameFromEmail(email),
          role: 'user' as AppUserRole
        }
      };
    }

    const payload = (await response.json()) as WorkerAuthMeResponse;
    const user = payload.user;

    return {
      authenticatedUser: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: normalizeRole(user.role)
      }
    };
  } catch {
    return {
      authenticatedUser: {
        id: null,
        email,
        name: displayNameFromEmail(email),
        role: 'user' as AppUserRole
      }
    };
  }
};
