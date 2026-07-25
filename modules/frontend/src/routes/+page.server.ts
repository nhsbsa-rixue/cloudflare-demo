import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { dev } from '$app/environment';

const LOCAL_WORKER_UPLOAD_URL = 'http://127.0.0.1:8787/api/upload?type=cnc';
const WORKER_UPLOAD_URL = 'https://worker.internal/api/upload?type=cnc';
const MOCK_USER_ID = '1111';

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

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile, uploadedFile.name);
      formData.append('userId', MOCK_USER_ID);

      const uploadUrl = dev ? LOCAL_WORKER_UPLOAD_URL : WORKER_UPLOAD_URL;
      const backendRequest = new Request(uploadUrl, {
        method: 'POST',
        body: formData
      });
      console.log('uploadUrl', uploadUrl);
      const response = await fetch(uploadUrl, backendRequest);

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
