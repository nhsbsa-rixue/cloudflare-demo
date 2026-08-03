import { describe, expect, it } from 'vitest';
import { displayNameFromEmail, fallbackUser, normalizeUserRole, resolveWorkerUser } from './user';

describe('displayNameFromEmail', () => {
  it('humanizes the local part', () => {
    expect(displayNameFromEmail('john.doe@example.com')).toBe('john doe');
    expect(displayNameFromEmail('a_b-c@y.com')).toBe('a b c');
  });
  it('falls back to the whole string when there is no @', () => {
    expect(displayNameFromEmail('plain')).toBe('plain');
  });
});

describe('normalizeUserRole', () => {
  it('accepts all known roles', () => {
    for (const role of ['admin', 'user', 'operator', 'editor', 'guest'] as const) {
      expect(normalizeUserRole(role)).toBe(role);
    }
  });
  it('defaults unknown/empty/null to user', () => {
    expect(normalizeUserRole('bogus')).toBe('user');
    expect(normalizeUserRole('')).toBe('user');
    expect(normalizeUserRole(null)).toBe('user');
    expect(normalizeUserRole(undefined)).toBe('user');
  });
});

describe('fallbackUser', () => {
  it('builds a null-id user with a humanized name and user role', () => {
    expect(fallbackUser('jane.roe@x.com')).toEqual({
      id: null,
      email: 'jane.roe@x.com',
      name: 'jane roe',
      role: 'user'
    });
  });
});

describe('resolveWorkerUser', () => {
  it('maps a worker payload and normalizes the role', () => {
    expect(resolveWorkerUser({ id: '7', email: 'a@b.com', name: 'Ann', role: 'operator' })).toEqual({
      id: '7',
      email: 'a@b.com',
      name: 'Ann',
      role: 'operator'
    });
  });
  it('coerces an unknown role to user', () => {
    expect(resolveWorkerUser({ id: '7', email: 'a@b.com', name: 'Ann', role: 'superadmin' }).role).toBe('user');
  });
});
