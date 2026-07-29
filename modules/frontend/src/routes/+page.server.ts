import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { bootstrapAuthUser } from '$lib/server/auth';

/**
 * Root entry routing:
 * - authenticated users continue to the upload experience
 * - unauthenticated users are redirected to a protected route, where
 *   Cloudflare Access performs the login challenge automatically
 */
export const load: PageServerLoad = async ({ request, platform, fetch, locals }) => {
  if (locals.authenticatedEmail) {
    try {
      await bootstrapAuthUser({ request, platform, fetch });
    } catch {
      // Best-effort bootstrap: redirect flow should still continue.
    }

    redirect(307, '/upload');
  }

  redirect(307, '/upload');
};
