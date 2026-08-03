/**
 * Shared helpers for talking to the backend worker from SvelteKit server code.
 *
 * In local dev the worker runs on its own origin; in production the request is
 * routed through the `WORKER` service binding, where the host portion is ignored.
 */

/**
 * Worker origin used in local dev. In production requests go through the
 * `WORKER` service binding, so only the path portion is meaningful.
 */
export const WORKER_ORIGIN = 'http://127.0.0.1:8787';

export const WORKER_AUTH_ME_URL = `${WORKER_ORIGIN}/api/auth/me`;
export const WORKER_CASES_URL = `${WORKER_ORIGIN}/api/cases`;
export const WORKER_FILES_URL = `${WORKER_ORIGIN}/api/files`;
export const WORKER_DEV_USERS_URL = `${WORKER_ORIGIN}/api/dev/users`;
export const WORKER_UPLOAD_URL = `${WORKER_ORIGIN}/api/upload?type=cnc`;

interface WorkerPlatform {
  env?: {
    WORKER?: { fetch(input: string | Request | URL, init?: RequestInit): Promise<Response> };
    'x-api-key'?: unknown;
    UPLOAD_API_KEY?: unknown;
  };
}

/**
 * Dispatch a request to the backend worker, using the platform service binding
 * in production and the provided `fetch` in dev. Returns `undefined` when no
 * worker binding is available (mirrors the previous inline behavior).
 */
export function fetchWorker(
  dev: boolean,
  platform: WorkerPlatform | undefined,
  fetchFn: (input: string | Request | URL, init?: RequestInit) => Promise<Response>,
  url: string,
  init?: RequestInit
): Promise<Response> | undefined {
  return dev ? fetchFn(url, init) : platform?.env?.WORKER?.fetch(url, init);
}

/** Resolve the upload API key from the platform env, falling back to the demo key. */
export function resolveUploadApiKey(platform: WorkerPlatform | undefined): string {
  return (platform?.env?.['x-api-key'] as string) || (platform?.env?.UPLOAD_API_KEY as string) || 'demo-key-12345';
}
