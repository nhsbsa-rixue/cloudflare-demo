import { dev } from '$app/environment';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { DEV_MOCK_USER_COOKIE, DEV_SIGNED_OUT_SENTINEL, type DevUserOption } from '$lib/server/dev-auth';
import { WORKER_DEV_USERS_URL } from '$lib/server/worker';

async function loadDevUsers(): Promise<DevUserOption[]> {
  try {
    const res = await fetch(WORKER_DEV_USERS_URL);
    if (!res.ok) return [];
    const data = (await res.json()) as { users: { email: string; name: string; role: string }[] };
    return data.users.map((u) => ({ email: u.email, label: `${u.name} (${u.role})` }));
  } catch {
    return [];
  }
}

function assertDev(): void {
  if (!dev) {
    error(404, 'Not found');
  }
}

export const load: PageServerLoad = async ({ cookies }) => {
  assertDev();

  const cookieValue = cookies.get(DEV_MOCK_USER_COOKIE) ?? null;
  const signedOut = cookieValue === DEV_SIGNED_OUT_SENTINEL;
  const knownUsers = await loadDevUsers();
  const currentEmail = signedOut ? null : (cookieValue ?? knownUsers[0]?.email ?? null);

  return {
    currentEmail,
    knownUsers
  };
};

export const actions: Actions = {
  switchUser: async ({ request, cookies }) => {
    assertDev();

    const formData = await request.formData();
    const emailValue = formData.get('email');
    if (typeof emailValue !== 'string') {
      return fail(400, { message: 'Invalid email input' });
    }
    const email = emailValue.trim().toLowerCase();

    const knownUsers = await loadDevUsers();
    const isKnownUser = knownUsers.some((user) => user.email === email);
    if (!isKnownUser) {
      return fail(400, { message: 'Unknown dev user' });
    }

    cookies.set(DEV_MOCK_USER_COOKIE, email, { path: '/', httpOnly: true, sameSite: 'lax' });
    redirect(303, '/');
  },

  logout: async ({ cookies }) => {
    assertDev();

    cookies.set(DEV_MOCK_USER_COOKIE, DEV_SIGNED_OUT_SENTINEL, { path: '/', httpOnly: true, sameSite: 'lax' });
    redirect(303, '/dev-login');
  }
};
