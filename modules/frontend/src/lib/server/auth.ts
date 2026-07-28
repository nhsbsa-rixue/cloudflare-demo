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

export function displayNameFromEmail(email: string): string {
  const [localPart = email] = email.split('@');
  return localPart.replace(/[._-]+/g, ' ');
}
