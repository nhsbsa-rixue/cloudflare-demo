import { fail } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { Actions, PageServerLoad } from './$types';

interface WorkerUploadResponse {
  upload: {
    key: string;
    filename: string;
    contentType: string;
    size: number;
    uploadedAt: string;
  };
}

const LOCAL_WORKER_UPLOAD_URL = process.env.LOCAL_WORKER_UPLOAD_URL ?? 'http://127.0.0.1:8787/api/upload';

// This runs on the server (Cloudflare Pages edge) — never exposed to the browser.
export const load: PageServerLoad = async () => {
  return {
    upload: null,
    error: null
  };
};

export const actions: Actions = {
  default: async ({ request, platform }) => {
    const formData = await request.formData();
    const uploadedFile = formData.get('file');

    if (!(uploadedFile instanceof File)) {
      return fail(400, {
        upload: null,
        error: 'file is required'
      });
    }

    const allowedTypes = new Set(['image/png', 'image/jpeg', 'application/pdf']);
    if (!allowedTypes.has(uploadedFile.type.toLowerCase())) {
      return fail(400, {
        upload: null,
        error: 'unsupported file type; only png, jpg, jpeg, pdf are allowed'
      });
    }

    const maxSizeBytes = 10 * 1024 * 1024;
    if (uploadedFile.size > maxSizeBytes) {
      return fail(413, {
        upload: null,
        error: 'file too large; max size is 10 MB'
      });
    }

    const workerBinding = platform?.env.WORKER;

    try {
      const backendFormData = new FormData();
      backendFormData.append('file', uploadedFile, uploadedFile.name);

      const backendRequest = new Request('https://worker.internal/api/upload', {
        method: 'POST',
        body: backendFormData
      });

      const response = workerBinding
        ? await workerBinding.fetch(backendRequest)
        : dev
          ? await fetch(
              new Request(LOCAL_WORKER_UPLOAD_URL, {
                method: 'POST',
                body: backendFormData
              })
            )
          : null;

      if (!response) {
        return fail(503, {
          upload: null,
          error: 'Worker unavailable via service binding'
        });
      }

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as { error?: string } | null;
        return fail(response.status, {
          upload: null,
          error: errorPayload?.error ?? `Worker request failed with ${response.status}`
        });
      }

      const payload: WorkerUploadResponse = await response.json();

      return {
        upload: payload.upload,
        error: null
      };
    } catch {
      return fail(503, {
        upload: null,
        error: 'Worker unavailable via service binding'
      });
    }
  }
};
