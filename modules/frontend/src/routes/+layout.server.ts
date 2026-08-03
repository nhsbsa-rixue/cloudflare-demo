import { dev } from '$app/environment';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { buildForwardedAuthHeaders } from '$lib/server/auth';
import { WORKER_AUTH_ME_URL, fetchWorkerFromBinding, fetchWorkerInDev } from '$lib/server/worker';
import { fallbackUser, resolveWorkerUser } from '$lib/server/user';
import type { WorkerAuthMeResponse } from '$lib/types';

export const load: LayoutServerLoad = async ({ request, platform, fetch, locals, url }) => {
  const email = locals.authenticatedEmail;

  if (!email) {
    return {
      authenticatedUser: null
    };
  }

  if (!dev && !platform?.env?.WORKER) {
    return {
      authenticatedUser: fallbackUser(email)
    };
  }

  try {
    const headers = buildForwardedAuthHeaders(request);
    const response = dev
      ? await fetchWorkerInDev(fetch, WORKER_AUTH_ME_URL, { headers })
      : await fetchWorkerFromBinding(platform, WORKER_AUTH_ME_URL, { headers });

    if (!response?.ok) {
      if (response?.status === 403 && url.pathname !== '/access-denied') {
        redirect(303, '/access-denied');
      }
      return {
        authenticatedUser: fallbackUser(email)
      };
    }

    const payload = (await response.json()) as WorkerAuthMeResponse;
    return {
      authenticatedUser: resolveWorkerUser(payload.user)
    };
  } catch {
    return {
      authenticatedUser: fallbackUser(email)
    };
  }
};
