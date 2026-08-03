import type { CaseType, Env } from './types';
import { R2UploadError, R2UploadService, type UploadSuccessResponse } from './services/r2-upload';
import { CasesService } from './services/cases';
import { type AuthenticatedActor, defaultStatusesForRole, isOperatorRole, normalizeRole } from './services/auth';
import { UsersService } from './services/users';
import {
  CORS_HEADERS,
  errorJson,
  filenameFromKey,
  jsonResponse,
  parsePositiveInt,
  parseStatuses,
  readAuthenticatedEmail
} from './http';
import { caseIdGenerator } from '../../utils';

const DEFAULT_ALLOWED_UPLOAD_TYPES = ['cnc'];
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

// --- Auth middleware ---------------------------------------------------------

interface ActorResult {
  actor?: AuthenticatedActor;
  response?: Response;
}

/** Resolve the authenticated actor, auto-registering first-time OTP-verified emails as guests. */
async function requireActor(request: Request, env: Env): Promise<ActorResult> {
  const email = readAuthenticatedEmail(request);
  if (!email) {
    return { response: errorJson('Authentication required', 401) };
  }

  const usersService = new UsersService(env);
  const userResult = await usersService.getUserByEmail(email);
  if (!userResult.ok) {
    return { response: errorJson(userResult.error.message, 500) };
  }

  let user = userResult.value;
  if (!user) {
    // First-time login: auto-register the OTP-verified email as a guest.
    const name = (email.split('@')[0] ?? email).replace(/[._-]+/g, ' ');
    const createResult = await usersService.createUser({ name, email, role: 'guest' });
    if (!createResult.ok) {
      return { response: errorJson(createResult.error.message, 500) };
    }
    user = createResult.value;
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

// --- Route context + handlers ------------------------------------------------

interface RouteContext {
  request: Request;
  env: Env;
  searchParams: URLSearchParams;
}

interface AuthedContext extends RouteContext {
  actor: AuthenticatedActor;
}

type Handler = (ctx: RouteContext) => Promise<Response> | Response;
type AuthedHandler = (ctx: AuthedContext) => Promise<Response> | Response;

/** Wrap a handler so it only runs once an authenticated actor is resolved. */
function withActor(handler: AuthedHandler): Handler {
  return async (ctx) => {
    const actorResult = await requireActor(ctx.request, ctx.env);
    if (!actorResult.actor) {
      return actorResult.response ?? errorJson('Authentication required', 401);
    }
    return handler({ ...ctx, actor: actorResult.actor });
  };
}

async function handleUpload({ request, env, searchParams, actor }: AuthedContext): Promise<Response> {
  if (actor.role === 'guest') {
    return errorJson('Forbidden', 403);
  }

  const typeParam = searchParams.get('type')?.toLowerCase() ?? 'cnc';

  // Validate X-API-Key header
  const apiKey = request.headers.get('X-API-Key');
  const envApiKey = env['x-api-key'] || env.UPLOAD_API_KEY || 'demo-key-12345';
  if (!apiKey || apiKey !== envApiKey) {
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
    const result = await uploadService.upload({ file: fileData, caseId, uploadedAt });
    const payload: UploadSuccessResponse = { upload: result };

    const createResult = await casesService.createCase({
      id: caseId,
      userId: actor.id,
      status: 'draft',
      imageUrl: result.key,
      type: typeParam as CaseType
    });
    if (!createResult.ok) {
      return errorJson(createResult.error.message, 400);
    }

    return jsonResponse(payload);
  } catch (error) {
    if (error instanceof R2UploadError) {
      return errorJson(error.message, error.status);
    }
    return errorJson('failed to store uploaded file', 503);
  }
}

function handleAuthMe({ actor }: AuthedContext): Response {
  return jsonResponse({
    user: { id: actor.id, email: actor.email, name: actor.name, role: actor.role }
  });
}

async function handleListCases({ env, searchParams, actor }: AuthedContext): Promise<Response> {
  const page = parsePositiveInt(searchParams.get('page'), 1);
  const pageSize = Math.min(parsePositiveInt(searchParams.get('pageSize'), DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
  const requestedStatuses = parseStatuses(searchParams.get('statuses'));
  const search = searchParams.get('search')?.trim() || undefined;
  const requestedUserId = searchParams.get('userId')?.trim() || undefined;

  const defaultStatuses = defaultStatusesForRole(actor.role);
  const statuses = requestedStatuses
    ? requestedStatuses.filter((status) => defaultStatuses.includes(status))
    : defaultStatuses;
  const userId = isOperatorRole(actor.role) ? requestedUserId : actor.id;

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

  return jsonResponse({
    cases: result.value.cases,
    total: result.value.total,
    page,
    pageSize,
    actorRole: actor.role
  });
}

async function handleDownloadFile({ env, searchParams, actor }: AuthedContext): Promise<Response> {
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

  if (!isOperatorRole(actor.role) && foundCase.userId !== actor.id) {
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

async function handleDevUsers({ env }: RouteContext): Promise<Response> {
  const usersService = new UsersService(env);
  const result = await usersService.getAllUsers();
  if (!result.ok) {
    return errorJson(result.error.message, 500);
  }
  return jsonResponse({
    users: result.value.map((u) => ({ email: u.email, name: u.name, role: u.role }))
  });
}

// --- Route table + dispatch --------------------------------------------------

const routes: Record<string, Partial<Record<string, Handler>>> = {
  '/api/upload': { POST: withActor(handleUpload) },
  '/api/auth/me': { GET: withActor(handleAuthMe) },
  '/api/cases': { GET: withActor(handleListCases) },
  '/api/files': { GET: withActor(handleDownloadFile) },
  '/api/dev/users': { GET: handleDevUsers }
};

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const { method } = request;
    const { pathname, searchParams } = new URL(request.url);

    // Handle CORS preflight — required when web (port 5173) calls worker (port 8787)
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const methods = routes[pathname];
    if (!methods) {
      return errorJson('Not Found', 404);
    }
    const handler = methods[method];
    if (!handler) {
      return errorJson('Method Not Allowed', 405);
    }

    return handler({ request, env, searchParams });
  }
} as ExportedHandler<Env>;

export * from './services/users';
export * from './services/cases';
