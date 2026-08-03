import { describe, expect, it } from 'vitest';
import { applyPagination } from './query-helpers';

function makeQuery() {
  const calls: string[] = [];
  const q = {
    calls,
    limit(n: number) {
      calls.push(`limit:${n}`);
      return q;
    },
    offset(n: number) {
      calls.push(`offset:${n}`);
      return q;
    }
  };
  return q;
}

describe('applyPagination', () => {
  it('applies nothing when options are missing', () => {
    const q = makeQuery();
    applyPagination(q);
    expect(q.calls).toEqual([]);
  });
  it('applies limit and offset when truthy', () => {
    const q = makeQuery();
    applyPagination(q, { limit: 10, offset: 20 });
    expect(q.calls).toEqual(['limit:10', 'offset:20']);
  });
  it('skips zero values (truthy semantics preserved)', () => {
    const q = makeQuery();
    applyPagination(q, { limit: 0, offset: 0 });
    expect(q.calls).toEqual([]);
  });
  it('applies only the provided field', () => {
    const q = makeQuery();
    applyPagination(q, { limit: 5 });
    expect(q.calls).toEqual(['limit:5']);
  });
});
