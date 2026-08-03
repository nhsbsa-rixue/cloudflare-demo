import { describe, expect, it } from 'vitest';
import { defaultStatusesForRole, isOperatorRole, normalizeRole } from './auth';

describe('normalizeRole', () => {
  it('accepts known roles', () => {
    for (const role of ['admin', 'user', 'operator', 'editor', 'guest'] as const) {
      expect(normalizeRole(role)).toBe(role);
    }
  });
  it('defaults unknown/empty/null to user', () => {
    expect(normalizeRole('bogus')).toBe('user');
    expect(normalizeRole('')).toBe('user');
    expect(normalizeRole(null)).toBe('user');
    expect(normalizeRole(undefined)).toBe('user');
  });
});

describe('isOperatorRole', () => {
  it('is true for operator-class roles', () => {
    expect(isOperatorRole('admin')).toBe(true);
    expect(isOperatorRole('operator')).toBe(true);
    expect(isOperatorRole('editor')).toBe(true);
  });
  it('is false for user and guest', () => {
    expect(isOperatorRole('user')).toBe(false);
    expect(isOperatorRole('guest')).toBe(false);
  });
});

describe('defaultStatusesForRole', () => {
  it('operators see all statuses', () => {
    expect(defaultStatusesForRole('admin')).toEqual(['draft', 'active', 'completed', 'archived']);
  });
  it('non-operators do not see archived', () => {
    expect(defaultStatusesForRole('user')).toEqual(['draft', 'active', 'completed']);
    expect(defaultStatusesForRole('guest')).toEqual(['draft', 'active', 'completed']);
  });
});
