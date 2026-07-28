import type { Env } from '../types';
import { R2UploadError, R2UploadService, type UploadSuccessResponse } from '../services/r2-upload';
import { CasesService } from '../services/cases';
import { UsersService } from '../services/users';
import { caseIdGenerator } from '../../../utils';

const CORS_HEADERS: HeadersInit = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};
const DEFAULT_ALLOWED_UPLOAD_TYPES = ['cnc'];
const PATH_UPLOAD = '/api/upload';
const PATH_CASES = '/api/cases';
const PATH_FILES = '/api/files';
const PATH_AUTH_ME = '/api/auth/me';

const ACCESS_EMAIL_HEADER = 'CF-Access-Authenticated-User-Email';
const FORWARDED_EMAIL_HEADER = 'X-Authenticated-User-Email';
const VALID_ROLES = new Set(['admin', 'user', 'operator', 'editor']);

const ALL_CASE_STATUSES = ['draft', 'active', 'completed', 'archived'] as const;
type CaseStatus = (typeof ALL_CASE_STATUSES)[number];

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

type AppRole = 'admin' | 'user' | 'operator' | 'editor';

interface AuthenticatedActor {
  id: string;
  email: string;
  name: string;
  role: AppRole;
}

function normalizeRole(value: string | null | undefined): AppRole {
  return value && VALID_ROLES.has(value) ? (value as AppRole) : 'user';
}

function isOperatorRole(role: AppRole): boolean {
  return role === 'admin' || role === 'operator' || role === 'editor';
}

function defaultStatusesForRole(role: AppRole): CaseStatus[] {
  if (isOperatorRole(role)) {
    return ['active', 'completed', 'archived'];
  }
  return ['draft', 'active', 'completed'];
}

function sanitizeEmail(value: string | null): string | null {
  const normalized = value?.trim().toLowerCase() ?? '';
  return normalized.length > 0 ? normalized : null;
}

function readAuthenticatedEmail(request: Request): string | null {
  return (
    sanitizeEmail(request.headers.get(ACCESS_EMAIL_HEADER)) ??
    sanitizeEmail(request.headers.get(FORWARDED_EMAIL_HEADER))
  );
}

async function requireActor(request: Request, env: Env): Promise<{ actor?: AuthenticatedActor; response?: Response }> {
  const email = readAuthenticatedEmail(request);
  if (!email) {
    return { response: errorJson('Authentication required', 401) };
  }

  const usersService = new UsersService(env);
  const userResult = await usersService.getUserByEmail(email);
  if (!userResult.ok) {
    return { response: errorJson(userResult.error.message, 500) };
  }

  const user = userResult.value;
  if (!user) {
    return { response: errorJson('Forbidden: invited users only', 403) };
  }

  return {
    actor: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: normalizeRole(user.role)
    }
  };
}

function parseStatuses(raw: string | null): CaseStatus[] | undefined {
  if (!raw) {
    return undefined;
  }
  const parsed = raw
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter((value): value is CaseStatus => (ALL_CASE_STATUSES as readonly string[]).includes(value));
  return parsed.length > 0 ? parsed : undefined;
}

function parsePositiveInt(raw: string | null, fallback: number): number {
  const parsed = Number.parseInt(raw ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function filenameFromKey(key: string): string {
  return key.split('/').pop() || 'download';
}

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
      const actorResult = await requireActor(request, env);
      if (!actorResult.actor) {
        return actorResult.response ?? errorJson('Authentication required', 401);
      }

      // Validate X-API-Key header
      const apiKey = request.headers.get('X-API-Key');
      if (!apiKey || apiKey !== env.UPLOAD_API_KEY) {
        return errorJson('Unauthorized: Invalid or missing API key', 401);
      }

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

      const uploadService = new R2UploadService(env);
      const casesService = new CasesService(env);

      try {
        const result = await uploadService.upload({
          file: fileData,
          caseId,
          uploadedAt
        });

        const payload: UploadSuccessResponse = {
          upload: result
        };

        const casePayload = {
          id: caseId,
          userId: actorResult.actor.id,
          status: 'draft' as const,
          imageUrl: result.key,
          type: typeParam as 'cnc' | '3d' | 'other'
        };

        const createResult = await casesService.createCase(casePayload);
        if (!createResult.ok) {
          return errorJson(createResult.error.message, 400);
        }

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

    if (pathname === PATH_AUTH_ME && method === 'GET') {
      const actorResult = await requireActor(request, env);
      if (!actorResult.actor) {
        return actorResult.response ?? errorJson('Authentication required', 401);
      }

      return Response.json(
        {
          user: {
            id: actorResult.actor.id,
            email: actorResult.actor.email,
            name: actorResult.actor.name,
            role: actorResult.actor.role
          }
        },
        { headers: withCorsHeaders() }
      );
    }

    if (pathname === PATH_AUTH_ME) {
      return errorJson('Method Not Allowed', 405);
    }

    // --- List cases (dashboard) ---
    if (pathname === PATH_CASES && method === 'GET') {
      const actorResult = await requireActor(request, env);
      if (!actorResult.actor) {
        return actorResult.response ?? errorJson('Authentication required', 401);
      }

      const page = parsePositiveInt(searchParams.get('page'), 1);
      const pageSize = Math.min(parsePositiveInt(searchParams.get('pageSize'), DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
      const requestedStatuses = parseStatuses(searchParams.get('statuses'));
      const search = searchParams.get('search')?.trim() || undefined;
      const requestedUserId = searchParams.get('userId')?.trim() || undefined;

      const defaultStatuses = defaultStatusesForRole(actorResult.actor.role);
      const statuses = requestedStatuses
        ? requestedStatuses.filter((status) => defaultStatuses.includes(status))
        : defaultStatuses;
      const userId = isOperatorRole(actorResult.actor.role) ? requestedUserId : actorResult.actor.id;

      const casesService = new CasesService(env);
      const result = await casesService.listCasesWithUser({
        statuses,
        userId,
        search,
        limit: pageSize,
        offset: (page - 1) * pageSize
      });

      if (!result.ok) {
        return errorJson(result.error.message, 500);
      }

      return Response.json(
        { cases: result.value.cases, total: result.value.total, page, pageSize, actorRole: actorResult.actor.role },
        { headers: withCorsHeaders() }
      );
    }

    if (pathname === PATH_CASES) {
      return errorJson('Method Not Allowed', 405);
    }

    // --- Download a case's stored file ---
    if (pathname === PATH_FILES && method === 'GET') {
      const actorResult = await requireActor(request, env);
      if (!actorResult.actor) {
        return actorResult.response ?? errorJson('Authentication required', 401);
      }

      const caseId = searchParams.get('id')?.trim();
      if (!caseId) {
        return errorJson('id is required', 400);
      }

      const casesService = new CasesService(env);
      const caseResult = await casesService.getCase(caseId);
      if (!caseResult.ok) {
        return errorJson(caseResult.error.message, 500);
      }
      const foundCase = caseResult.value;
      if (!foundCase) {
        return errorJson('Not Found', 404);
      }

      if (!isOperatorRole(actorResult.actor.role) && foundCase.userId !== actorResult.actor.id) {
        return errorJson('Forbidden', 403);
      }

      const uploadService = new R2UploadService(env);
      let object: R2ObjectBody | null;
      try {
        object = await uploadService.getObject(foundCase.imageUrl);
      } catch (error) {
        if (error instanceof R2UploadError) {
          return errorJson(error.message, error.status);
        }
        return errorJson('failed to read stored file', 503);
      }

      if (!object) {
        return errorJson('Not Found', 404);
      }

      const filename = object.customMetadata?.originalFilename || filenameFromKey(foundCase.imageUrl);
      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
      headers.set('Content-Disposition', `attachment; filename="${filename.replace(/"/g, '')}"`);
      headers.set('Access-Control-Allow-Origin', '*');

      return new Response(object.body, { status: 200, headers });
    }

    if (pathname === PATH_FILES) {
      return errorJson('Method Not Allowed', 405);
    }

    return errorJson('Not Found', 404);
  }
} as ExportedHandler<Env>;
