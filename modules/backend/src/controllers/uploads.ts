import type { Env } from '../types';
import { R2UploadError, R2UploadService, type UploadSuccessResponse } from '../services/r2-upload';
import { caseIdGenerator } from '../../../utils';

const CORS_HEADERS: HeadersInit = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};
const DEFAULT_ALLOWED_UPLOAD_TYPES = ['cnc'];
const PATH_UPLOAD = '/api/upload';

function withCorsHeaders(headers?: HeadersInit): Headers {
  const merged = new Headers(CORS_HEADERS);
  if (headers) {
    for (const [key, value] of new Headers(headers)) {
      merged.set(key, value);
    }
  }
  return merged;
}

function errorJson(error: string, status: number): Response {
  return Response.json({ error }, { status, headers: withCorsHeaders() });
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const { method, url } = request;
    const { pathname, searchParams } = new URL(url);
    const typeParam = searchParams.get('type')?.toLowerCase() ?? 'cnc';

    // Handle CORS preflight — required when web (port 5173) calls worker (port 8787)
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (pathname === PATH_UPLOAD && method === 'POST') {
      let formData: FormData;
      try {
        formData = await request.formData();
      } catch {
        return errorJson('Invalid multipart form body', 400);
      }

      const fileData = formData.get('file') as unknown;
      if (!(fileData instanceof File)) {
        return errorJson('file is required', 400);
      }

      const uploadedAt = new Date().toISOString();

      if (!DEFAULT_ALLOWED_UPLOAD_TYPES.includes(typeParam)) {
        throw new R2UploadError(`unsupported upload type; allowed: ${DEFAULT_ALLOWED_UPLOAD_TYPES.join(', ')}`, 400);
      }

      const caseId = caseIdGenerator(typeParam);

      const uploadService = new R2UploadService(env.UPLOADS_BUCKET);

      try {
        const result = await uploadService.upload({
          file: fileData,
          caseId,
          uploadedAt
        });

        const payload: UploadSuccessResponse = {
          upload: result
        };

        return Response.json(payload, { headers: withCorsHeaders() });
      } catch (error) {
        if (error instanceof R2UploadError) {
          return errorJson(error.message, error.status);
        }

        return errorJson('failed to store uploaded file', 503);
      }
    }

    if (pathname === PATH_UPLOAD) {
      return errorJson('Method Not Allowed', 405);
    }

    return errorJson('Not Found', 404);
  }
} satisfies ExportedHandler<Env>;
