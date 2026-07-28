import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { dev } from '$app/environment';
import { buildForwardedAuthHeaders } from '$lib/server/auth';
import type { UploadResult, WorkerUploadResponse } from '$lib/types';

const LOCAL_UPLOAD_URL = 'http://127.0.0.1:8787/api/upload?type=cnc';

/**
 * Derive a case id from the R2 object key.
 * Keys look like `uploads/YYYY/MM/DD/{caseId}.{ext}`.
 */
function caseIdFromKey(key: string): string {
  const filename = key.split('/').pop() ?? key;
  const dotIndex = filename.lastIndexOf('.');
  return dotIndex > 0 ? filename.slice(0, dotIndex) : filename;
}

/** Build the detail-page URL, carrying the uploaded file metadata in the query string. */
function detailUrl(upload: UploadResult): string {
  const params = new URLSearchParams({
    filename: upload.filename,
    size: String(upload.size),
    contentType: upload.contentType,
    uploadedAt: upload.uploadedAt,
    key: upload.key
  });
  return `/design/${caseIdFromKey(upload.key)}?${params.toString()}`;
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

    if (!dev && !platform?.env?.WORKER) {
      return fail(503, {
        upload: null,
        error: 'Upload service currently unavailable'
      });
    }

    let upload: UploadResult;
    try {
      const body = new FormData();
      body.append('file', uploadedFile, uploadedFile.name);

      const apiKey = (platform?.env?.UPLOAD_API_KEY as string) || 'demo-key-12345';
      const headers = buildForwardedAuthHeaders(request);
      headers.set('X-API-Key', apiKey);

      const requestInit: RequestInit = {
        method: 'POST',
        body,
        headers
      };

      const response = dev
        ? await fetch(LOCAL_UPLOAD_URL, requestInit)
        : await platform?.env.WORKER?.fetch(LOCAL_UPLOAD_URL, requestInit);

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as { error?: string } | null;
        return fail(response.status, {
          upload: null,
          error: errorPayload?.error ?? `Worker request failed with ${response.status}`
        });
      }

      const payload: WorkerUploadResponse = await response.json();
      upload = payload.upload;
    } catch {
      return fail(503, {
        upload: null,
        error: 'Upload service currently unavailable'
      });
    }

    // On success, hand off to the read-only detail page.
    redirect(303, detailUrl(upload));
  }
};
