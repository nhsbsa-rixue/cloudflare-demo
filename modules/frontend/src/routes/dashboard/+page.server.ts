import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { dev } from '$app/environment';
import { buildForwardedAuthHeaders } from '$lib/server/auth';
import { WORKER_CASES_URL, fetchWorker } from '$lib/server/worker';
import type { AppUserRole, WorkerCasesResponse } from '$lib/types';

const PAGE_SIZE = 10;

function normalizeRole(value: string | null | undefined): AppUserRole {
  if (value === 'admin' || value === 'operator' || value === 'editor') {
    return value;
  }
  return 'user';
}

export const load: PageServerLoad = async ({ request, url, platform, fetch, parent }) => {
  const { authenticatedUser } = await parent();
  if (authenticatedUser?.role === 'guest') {
    redirect(303, '/about');
  }
  const requestedPage = Number.parseInt(url.searchParams.get('page') ?? '1', 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const search = url.searchParams.get('search')?.trim() ?? '';

  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(PAGE_SIZE)
  });
  if (search) {
    params.set('search', search);
  }

  const empty = {
    cases: [],
    total: 0,
    page,
    pageSize: PAGE_SIZE,
    role: 'user' as AppUserRole,
    search
  };

  if (!dev && !platform?.env?.WORKER) {
    return { ...empty, error: 'Cases service currently unavailable' };
  }

  const target = `${WORKER_CASES_URL}?${params.toString()}`;

  try {
    const headers = buildForwardedAuthHeaders(request);
    const response = await fetchWorker(dev, platform, fetch, target, { headers });

    if (!response || !response.ok) {
      return { ...empty, error: 'Unable to load cases' };
    }
    const payload = (await response.json()) as WorkerCasesResponse;
    return {
      cases: payload.cases,
      total: payload.total,
      page: payload.page,
      pageSize: payload.pageSize,
      role: normalizeRole(payload.actorRole),
      search,
      error: null
    };
  } catch {
    return { ...empty, error: 'Unable to load cases' };
  }
};
