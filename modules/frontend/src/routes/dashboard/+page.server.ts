import type { PageServerLoad } from './$types';
import { dev } from '$app/environment';
import type { UserRole, WorkerCasesResponse } from '$lib/types';

// Worker origin used in local dev; in production requests are routed through the
// `WORKER` service binding, where the host portion is ignored.
const WORKER_CASES_URL = 'http://127.0.0.1:8787/api/cases';
const PAGE_SIZE = 10;

/**
 * Status visibility per role. Real auth is wired later; for now the role is a
 * preview toggle in the query string.
 * - primary  → their own draft / active / completed cases
 * - operator → all active / completed / archived cases
 */
const ROLE_STATUSES: Record<UserRole, string[]> = {
  primary: ['draft', 'active', 'completed'],
  operator: ['active', 'completed', 'archived']
};

function normalizeRole(value: string | null): UserRole {
  return value === 'operator' ? 'operator' : 'primary';
}

export const load: PageServerLoad = async ({ url, platform, fetch }) => {
  const role = normalizeRole(url.searchParams.get('role'));
  const requestedPage = Number.parseInt(url.searchParams.get('page') ?? '1', 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const search = url.searchParams.get('search')?.trim() ?? '';

  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(PAGE_SIZE),
    statuses: ROLE_STATUSES[role].join(',')
  });
  if (search) {
    params.set('search', search);
  }

  const empty = {
    cases: [],
    total: 0,
    page,
    pageSize: PAGE_SIZE,
    role,
    search
  };

  if (!dev && !platform?.env?.WORKER) {
    return { ...empty, error: 'Cases service currently unavailable' };
  }

  const target = `${WORKER_CASES_URL}?${params.toString()}`;

  try {
    const response = dev ? await fetch(target) : await platform?.env?.WORKER?.fetch(target);
    if (!response || !response.ok) {
      return { ...empty, error: 'Unable to load cases' };
    }
    const payload = (await response.json()) as WorkerCasesResponse;
    return {
      cases: payload.cases,
      total: payload.total,
      page: payload.page,
      pageSize: payload.pageSize,
      role,
      search,
      error: null
    };
  } catch {
    return { ...empty, error: 'Unable to load cases' };
  }
};
