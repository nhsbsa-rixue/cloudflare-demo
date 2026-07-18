import type { PageServerLoad } from './$types';

interface WorkerHelloResponse {
  message: string;
  timestamp: string;
}

// This runs on the server (Cloudflare Pages edge) — never exposed to the browser.
export const load: PageServerLoad = async ({ platform }) => {
  const workerBinding = platform?.env.WORKER;

  if (!workerBinding) {
    return {
      greeting: null,
      error: 'Worker unavailable via service binding'
    };
  }

  try {
    const response = await workerBinding.fetch(new Request('https://worker.internal/api/hello', { method: 'GET' }));
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const greeting: WorkerHelloResponse = await response.json();
    return { greeting, error: null };
  } catch {
    return {
      greeting: null,
      error: 'Worker unavailable via service binding'
    };
  }
};
