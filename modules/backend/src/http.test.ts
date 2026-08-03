import { describe, expect, it } from 'vitest';
import {
  errorJson,
  filenameFromKey,
  jsonResponse,
  parsePositiveInt,
  parseStatuses,
  readAuthenticatedEmail,
  sanitizeEmail,
  withCorsHeaders
} from './http';

describe('sanitizeEmail', () => {
  it('trims and lowercases', () => {
    expect(sanitizeEmail('  Foo@Bar.COM ')).toBe('foo@bar.com');
  });
  it('returns null for empty/whitespace/null', () => {
    expect(sanitizeEmail('')).toBeNull();
    expect(sanitizeEmail('   ')).toBeNull();
    expect(sanitizeEmail(null)).toBeNull();
  });
});

describe('readAuthenticatedEmail', () => {
  it('prefers the Access header', () => {
    const req = new Request('https://x/', {
      headers: {
        'CF-Access-Authenticated-User-Email': 'A@B.com',
        'X-Authenticated-User-Email': 'c@d.com'
      }
    });
    expect(readAuthenticatedEmail(req)).toBe('a@b.com');
  });
  it('falls back to the forwarded header', () => {
    const req = new Request('https://x/', { headers: { 'X-Authenticated-User-Email': 'c@d.com' } });
    expect(readAuthenticatedEmail(req)).toBe('c@d.com');
  });
  it('returns null when neither present', () => {
    expect(readAuthenticatedEmail(new Request('https://x/'))).toBeNull();
  });
});

describe('parseStatuses', () => {
  it('keeps valid statuses (case-insensitive)', () => {
    expect(parseStatuses('draft, ACTIVE')).toEqual(['draft', 'active']);
  });
  it('drops invalid entries', () => {
    expect(parseStatuses('draft,bogus')).toEqual(['draft']);
  });
  it('returns undefined for empty/null/all-invalid', () => {
    expect(parseStatuses('')).toBeUndefined();
    expect(parseStatuses(null)).toBeUndefined();
    expect(parseStatuses('bogus')).toBeUndefined();
  });
});

describe('parsePositiveInt', () => {
  it('parses positive integers', () => {
    expect(parsePositiveInt('5', 10)).toBe(5);
  });
  it('falls back on zero, negative, non-numeric, null', () => {
    expect(parsePositiveInt('0', 10)).toBe(10);
    expect(parsePositiveInt('-3', 10)).toBe(10);
    expect(parsePositiveInt('abc', 10)).toBe(10);
    expect(parsePositiveInt(null, 10)).toBe(10);
  });
});

describe('filenameFromKey', () => {
  it('returns the last path segment', () => {
    expect(filenameFromKey('uploads/2026/01/02/case.pdf')).toBe('case.pdf');
  });
  it('handles keys without slashes and empty keys', () => {
    expect(filenameFromKey('nokey')).toBe('nokey');
    expect(filenameFromKey('')).toBe('download');
  });
});

describe('CORS + JSON responses', () => {
  it('errorJson carries status, error body and CORS header', async () => {
    const res = errorJson('nope', 403);
    expect(res.status).toBe(403);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(await res.json()).toEqual({ error: 'nope' });
  });
  it('jsonResponse defaults to 200 with CORS', async () => {
    const res = jsonResponse({ ok: true });
    expect(res.status).toBe(200);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(await res.json()).toEqual({ ok: true });
  });
  it('withCorsHeaders merges caller headers', () => {
    const h = withCorsHeaders({ 'Content-Disposition': 'attachment' });
    expect(h.get('Content-Disposition')).toBe('attachment');
    expect(h.get('Access-Control-Allow-Origin')).toBe('*');
  });
});
