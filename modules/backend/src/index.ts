import type { Env } from './types';

const CORS_HEADERS: HeadersInit = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'pdf']);
const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'application/pdf']);

interface UploadSuccessResponse {
  upload: {
    key: string;
    filename: string;
    contentType: string;
    size: number;
    uploadedAt: string;
  };
}

function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot < 0 || lastDot === filename.length - 1) {
    return '';
  }
  return filename.slice(lastDot + 1).toLowerCase();
}

function sanitizeFilename(filename: string): string {
  return filename
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);
}

function createObjectKey(filename: string, uploadedAtIso: string): string {
  const date = new Date(uploadedAtIso);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const timestamp = date.getTime();
  const randomSuffix = crypto.randomUUID().slice(0, 8);
  const cleanedName = sanitizeFilename(filename) || 'upload.bin';

  return `uploads/${year}/${month}/${day}/${timestamp}-${randomSuffix}-${cleanedName}`;
}

function withCorsHeaders(headers?: HeadersInit): Headers {
  const merged = new Headers(CORS_HEADERS);
  if (headers) {
    new Headers(headers).forEach((value, key) => merged.set(key, value));
  }
  return merged;
}

function errorJson(error: string, status: number): Response {
  return Response.json({ error }, { status, headers: withCorsHeaders() });
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const { method, url } = request;
    const { pathname } = new URL(url);

    // Handle CORS preflight — required when web (port 5173) calls worker (port 8787)
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (pathname === '/api/upload' && method === 'POST') {
      let formData: FormData;
      try {
        formData = await request.formData();
      } catch {
        return errorJson('Invalid multipart form body', 400);
      }

      const incomingFile = formData.get('file') as unknown;
      if (!(incomingFile instanceof File)) {
        return errorJson('file is required', 400);
      }

      const filename = incomingFile.name.trim();
      if (!filename) {
        return errorJson('file name is required', 400);
      }

      const extension = getExtension(filename);
      const normalizedMimeType = incomingFile.type.toLowerCase();
      const extensionAllowed = ALLOWED_EXTENSIONS.has(extension);
      const mimeAllowed = normalizedMimeType ? ALLOWED_MIME_TYPES.has(normalizedMimeType) : false;

      if (!extensionAllowed || !mimeAllowed) {
        return errorJson('unsupported file type; only png, jpg, jpeg, pdf are allowed', 400);
      }

      if (incomingFile.size > MAX_FILE_SIZE_BYTES) {
        return errorJson('file too large; max size is 10 MB', 413);
      }

      const uploadedAt = new Date().toISOString();
      const key = createObjectKey(filename, uploadedAt);
      const contentType = normalizedMimeType || 'application/octet-stream';

      try {
        await env.UPLOADS_BUCKET.put(key, incomingFile.stream(), {
          httpMetadata: {
            contentType
          },
          customMetadata: {
            originalFilename: filename,
            uploadedAt
          }
        });
      } catch {
        return errorJson('failed to store uploaded file', 503);
      }

      const payload: UploadSuccessResponse = {
        upload: {
          key,
          filename,
          contentType,
          size: incomingFile.size,
          uploadedAt
        }
      };

      return Response.json(payload, { headers: withCorsHeaders() });
    }

    if (pathname === '/api/upload') {
      return errorJson('Method Not Allowed', 405);
    }

    return errorJson('Not Found', 404);
  }
} satisfies ExportedHandler<Env>;
