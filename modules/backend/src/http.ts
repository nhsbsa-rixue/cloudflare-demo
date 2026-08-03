import { CASE_STATUSES, type CaseStatus } from './types';

export const ACCESS_EMAIL_HEADER = 'CF-Access-Authenticated-User-Email';
export const FORWARDED_EMAIL_HEADER = 'X-Authenticated-User-Email';

export const CORS_HEADERS: HeadersInit = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

/** Merge caller headers over the base CORS headers. */
export function withCorsHeaders(headers?: HeadersInit): Headers {
  const merged = new Headers(CORS_HEADERS);
  if (headers) {
    for (const [key, value] of new Headers(headers)) {
      merged.set(key, value);
    }
  }
  return merged;
}

/** JSON response carrying the CORS headers. */
export function jsonResponse(data: unknown, init?: ResponseInit): Response {
  return Response.json(data, { ...init, headers: withCorsHeaders(init?.headers) });
}

/** JSON error envelope `{ error }` with the given status and CORS headers. */
export function errorJson(error: string, status: number): Response {
  return Response.json({ error }, { status, headers: withCorsHeaders() });
}

/** Trim + lowercase an email header value; empty becomes null. */
export function sanitizeEmail(value: string | null): string | null {
  const normalized = value?.trim().toLowerCase() ?? '';
  return normalized.length > 0 ? normalized : null;
}

/** Read the authenticated email from the Access header, falling back to the forwarded one. */
export function readAuthenticatedEmail(request: Request): string | null {
  return (
    sanitizeEmail(request.headers.get(ACCESS_EMAIL_HEADER)) ??
    sanitizeEmail(request.headers.get(FORWARDED_EMAIL_HEADER))
  );
}

/** Parse a comma-separated status list, keeping only valid statuses; undefined when none. */
export function parseStatuses(raw: string | null): CaseStatus[] | undefined {
  if (!raw) {
    return undefined;
  }
  const parsed = raw
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter((value): value is CaseStatus => (CASE_STATUSES as readonly string[]).includes(value));
  return parsed.length > 0 ? parsed : undefined;
}

/** Parse a positive integer query value, falling back when missing/invalid. */
export function parsePositiveInt(raw: string | null, fallback: number): number {
  const parsed = Number.parseInt(raw ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/** Derive a download filename from an R2 object key. */
export function filenameFromKey(key: string): string {
  return key.split('/').pop() || 'download';
}
