import { dev } from '$app/environment';

const ACCESS_EMAIL_HEADER = 'CF-Access-Authenticated-User-Email';
const FORWARDED_EMAIL_HEADER = 'X-Authenticated-User-Email';
const DEV_FALLBACK_EMAIL = 'demo@dongyu.com';

function normalizeEmail(value: string | null): string | null {
  const email = value?.trim().toLowerCase();
  return email && email.length > 0 ? email : null;
}

export function getAuthenticatedEmailFromRequest(request: Request): string | null {
  const accessEmail = normalizeEmail(request.headers.get(ACCESS_EMAIL_HEADER));
  if (accessEmail) {
    return accessEmail;
  }

  const forwardedEmail = normalizeEmail(request.headers.get(FORWARDED_EMAIL_HEADER));
  if (forwardedEmail) {
    return forwardedEmail;
  }

  if (dev) {
    return DEV_FALLBACK_EMAIL;
  }

  return null;
}

export function buildForwardedAuthHeaders(request: Request): Headers {
  const headers = new Headers();
  const email = getAuthenticatedEmailFromRequest(request);
  if (email) {
    headers.set(FORWARDED_EMAIL_HEADER, email);
  }
  return headers;
}

interface WorkerBinding {
  fetch(input: string | Request | URL, init?: RequestInit): Promise<Response>;
}

interface RootBootstrapContext {
  request: Request;
  fetch: (input: string | Request | URL, init?: RequestInit) => Promise<Response>;
  platform?: {
    env?: {
      WORKER?: WorkerBinding;
    };
  };
}

const WORKER_AUTH_ME_URL = 'http://127.0.0.1:8787/api/auth/me';

export async function bootstrapAuthUser(context: RootBootstrapContext): Promise<void> {
  const headers = buildForwardedAuthHeaders(context.request);
  if (dev) {
    await context.fetch(WORKER_AUTH_ME_URL, { headers });
    return;
  }

  if (context.platform?.env?.WORKER) {
    await context.platform.env.WORKER.fetch(WORKER_AUTH_ME_URL, { headers });
  }
}

export function displayNameFromEmail(email: string): string {
  const [localPart = email] = email.split('@');
  return localPart.replace(/[._-]+/g, ' ');
}
