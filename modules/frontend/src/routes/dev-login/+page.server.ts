import { dev } from '$app/environment';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { DEV_MOCK_USER_COOKIE, DEV_SIGNED_OUT_SENTINEL, KNOWN_DEV_USERS } from '$lib/server/dev-auth';

function assertDev(): void {
  if (!dev) {
    error(404, 'Not found');
  }
}

export const load: PageServerLoad = async ({ cookies }) => {
  assertDev();

  const cookieValue = cookies.get(DEV_MOCK_USER_COOKIE) ?? null;
  const signedOut = cookieValue === DEV_SIGNED_OUT_SENTINEL;
  const currentEmail = signedOut ? null : (cookieValue ?? KNOWN_DEV_USERS[0]?.email ?? null);

  return {
    currentEmail,
    knownUsers: KNOWN_DEV_USERS
  };
};

export const actions: Actions = {
  switchUser: async ({ request, cookies }) => {
    assertDev();

    const formData = await request.formData();
    const email = String(formData.get('email') ?? '')
      .trim()
      .toLowerCase();

    const isKnownUser = KNOWN_DEV_USERS.some((user) => user.email === email);
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
