import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/**
 * Root entry routing:
 * - authenticated users continue to the upload experience
 * - unauthenticated users are redirected to a protected route, where
 *   Cloudflare Access performs the login challenge automatically
 */
export const load: PageServerLoad = async ({ locals }) => {
  if (locals.authenticatedEmail) {
    redirect(307, '/upload');
  }

  redirect(307, '/upload');
};
