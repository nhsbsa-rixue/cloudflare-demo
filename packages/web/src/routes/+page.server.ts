import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

interface WorkerHelloResponse {
  message: string;
  timestamp: string;
}

// This runs on the server (Cloudflare Pages edge) — never exposed to the browser.
export const load: PageServerLoad = async ({ fetch }) => {
  // WORKER_URL is set in .env for local dev and in CF Pages env vars for production.
  const workerUrl = env.WORKER_URL ?? 'http://localhost:8787';

  try {
    const response = await fetch(`${workerUrl}/api/hello`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const greeting: WorkerHelloResponse = await response.json();
    return { greeting, error: null };
  } catch {
    return {
      greeting: null,
      error: 'Worker unavailable — start it with: pnpm dev:worker'
    };
  }
};
