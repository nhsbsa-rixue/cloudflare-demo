import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

interface WorkerHelloResponse {
  message: string;
  timestamp: string;
}

// This runs on the server (Cloudflare Pages edge) — never exposed to the browser.
export const load: PageServerLoad = async () => {
  return {
    greeting: null,
    error: null
  };
};

export const actions: Actions = {
  default: async ({ request, platform }) => {
    const formData = await request.formData();
    const rawUsername = formData.get('username');
    const username = typeof rawUsername === 'string' ? rawUsername.trim() : '';

    if (!username) {
      return fail(400, {
        greeting: null,
        error: 'username is required',
        username
      });
    }

    const workerBinding = platform?.env.WORKER;

    if (!workerBinding) {
      return fail(503, {
        greeting: null,
        error: 'Worker unavailable via service binding',
        username
      });
    }

    try {
      const response = await workerBinding.fetch(
        new Request('https://worker.internal/api/hello', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username })
        })
      );

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as { error?: string } | null;
        return fail(response.status, {
          greeting: null,
          error: errorPayload?.error ?? `Worker request failed with ${response.status}`,
          username
        });
      }

      const greeting: WorkerHelloResponse = await response.json();

      return {
        greeting,
        error: null,
        username
      };
    } catch {
      return fail(503, {
        greeting: null,
        error: 'Worker unavailable via service binding',
        username
      });
    }
  }
};
