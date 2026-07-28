import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { dev } from '$app/environment';

// Worker origin used in local dev; in production the request is routed through
// the `WORKER` service binding, where the host portion is ignored.
const WORKER_FILES_URL = 'http://127.0.0.1:8787/api/files';

/**
 * Streams a case's stored design file from the backend worker so the browser
 * always downloads from the frontend origin (no CORS, no exposed worker URL).
 */
export const GET: RequestHandler = async ({ url, platform, fetch }) => {
  const id = url.searchParams.get('id')?.trim();
  if (!id) {
    throw error(400, 'id is required');
  }

  const target = `${WORKER_FILES_URL}?id=${encodeURIComponent(id)}`;

  if (!dev && !platform?.env?.WORKER) {
    throw error(503, 'File service currently unavailable');
  }

  let response: Response | undefined;
  try {
    response = dev ? await fetch(target) : await platform?.env?.WORKER?.fetch(target);
  } catch {
    throw error(503, 'File service currently unavailable');
  }

  if (!response) {
    throw error(503, 'File service currently unavailable');
  }
  if (!response.ok) {
    throw error(response.status, 'Failed to download file');
  }

  const headers = new Headers();
  const contentType = response.headers.get('content-type');
  if (contentType) {
    headers.set('content-type', contentType);
  }
  const disposition = response.headers.get('content-disposition');
  if (disposition) {
    headers.set('content-disposition', disposition);
  }

  return new Response(response.body, { status: 200, headers });
};
