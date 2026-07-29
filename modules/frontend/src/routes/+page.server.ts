import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/**
 * Root entry routing:
 * - authenticated users continue to the upload experience
 * - unauthenticated users are sent to Cloudflare Access login first
 */
export const load: PageServerLoad = async ({ locals, url }) => {
  if (locals.authenticatedEmail) {
    redirect(307, '/upload');
  }

  const loginUrl = new URL('/cdn-cgi/access/login', url);
  loginUrl.searchParams.set('redirect_url', new URL('/upload', url).toString());
  redirect(307, loginUrl.toString());
};
