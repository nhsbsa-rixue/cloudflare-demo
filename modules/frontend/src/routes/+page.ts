import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

// The upload experience now lives at /upload; keep the root as an entry point.
export const load: PageLoad = () => {
  redirect(307, '/upload');
};
