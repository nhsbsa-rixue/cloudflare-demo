import { fail } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { Actions, PageServerLoad } from './$types';

const ALLOWED_UPLOAD_TYPES = ['cnc'] as const;

interface WorkerUploadResponse {
  upload: {
    key: string;
    filename: string;
    contentType: string;
    size: number;
    uploadedAt: string;
  };
}

// This runs on the server (Cloudflare Pages edge) — never exposed to the browser.
export const load: PageServerLoad = async () => {
  return {
    upload: null,
    error: null
  };
};

export const actions: Actions = {
  default: async ({ request, platform, url }) => {
    const formData = await request.formData();
    const uploadedFile = formData.get('file');
    const requestedType = (url.searchParams.get('type') ?? 'cnc').toLowerCase();

    if (!ALLOWED_UPLOAD_TYPES.includes(requestedType as (typeof ALLOWED_UPLOAD_TYPES)[number])) {
      return fail(400, {
        upload: null,
        error: `unsupported upload type; allowed: ${ALLOWED_UPLOAD_TYPES.join(', ')}`
      });
    }

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
    const LOCAL_WORKER_UPLOAD_URL = `http://127.0.0.1:8787/api/upload?type=${requestedType}`;

    try {
      const backendFormData = new FormData();
      backendFormData.append('file', uploadedFile, uploadedFile.name);

      const backendRequest = new Request(`https://worker.internal/api/upload?type=${requestedType}`, {
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
          error: 'Upload service currently unavailable'
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
        error: 'Upload service currently unavailable'
      });
    }
  }
};
