import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { dev } from '$app/environment';
import type { WorkerUploadResponse } from '$lib/types';

const LOCAL_UPLOAD_URL = 'http://127.0.0.1:8787/api/upload?type=cnc';
const UPLOAD_PATH = '/api/upload?type=cnc';
const MOCK_USER_ID = '1111';

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

    if (!dev && !platform?.env?.WORKER) {
      return fail(503, {
        upload: null,
        error: 'Upload service currently unavailable'
      });
    }

    try {
      const body = new FormData();
      body.append('file', uploadedFile, uploadedFile.name);
      body.append('userId', MOCK_USER_ID);
      const requestInit = { method: 'POST', body };

      const response = dev
        ? await fetch(LOCAL_UPLOAD_URL, requestInit)
        : await platform!.env.WORKER!.fetch(LOCAL_UPLOAD_URL, requestInit);

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
