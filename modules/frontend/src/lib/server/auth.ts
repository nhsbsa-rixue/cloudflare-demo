import { dev } from '$app/environment';
import { DEV_MOCK_USER_COOKIE, DEV_SIGNED_OUT_SENTINEL } from './dev-auth';
import { WORKER_AUTH_ME_URL } from './worker';

const ACCESS_EMAIL_HEADER = 'CF-Access-Authenticated-User-Email';
const FORWARDED_EMAIL_HEADER = 'X-Authenticated-User-Email';
const DEV_FALLBACK_EMAIL = 'demo@dongyu.com';

function normalizeEmail(value: string | null): string | null {
  const email = value?.trim().toLowerCase();
  return email && email.length > 0 ? email : null;
}

function readCookieValue(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) {
    return null;
  }

  for (const part of cookieHeader.split(';')) {
    const separatorIndex = part.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }
    const key = part.slice(0, separatorIndex).trim();
    if (key === name) {
      return decodeURIComponent(part.slice(separatorIndex + 1).trim());
    }
  }

  return null;
}

// CF Access only injects the email header on protected paths; the JWT cookie is domain-wide.
function getEmailFromCfJwtCookie(request: Request): string | null {
  const token = readCookieValue(request, 'CF_Authorization');
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3 || !parts[1]) return null;
    const payload = JSON.parse(atob(parts[1])) as { email?: unknown; exp?: unknown };
    if (typeof payload.exp === 'number' && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return normalizeEmail(typeof payload.email === 'string' ? payload.email : null);
  } catch {
    return null;
  }
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
    const mockCookie = readCookieValue(request, DEV_MOCK_USER_COOKIE);
    if (mockCookie === DEV_SIGNED_OUT_SENTINEL) {
      return null;
    }
    const mockEmail = normalizeEmail(mockCookie);
    if (mockEmail) {
      return mockEmail;
    }
    return DEV_FALLBACK_EMAIL;
  }

  return getEmailFromCfJwtCookie(request);
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
