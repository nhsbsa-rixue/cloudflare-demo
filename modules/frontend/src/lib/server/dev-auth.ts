/**
 * Local-development-only mock authentication helpers.
 *
 * Cloudflare Access is not available under `vite dev` / `wrangler dev`, so the
 * app falls back to a static mock user (see `DEV_FALLBACK_EMAIL` in `auth.ts`).
 * This module adds a cookie-based override so that fallback can be switched or
 * cleared (signed out) from the `/dev-login` route without restarting the dev
 * server. None of this is reachable in production: every consumer must gate
 * usage behind SvelteKit's `dev` flag, which is compiled out of production
 * builds.
 */

export const DEV_MOCK_USER_COOKIE = 'dev-mock-user-email';

/** Sentinel cookie value representing an explicit local sign-out. */
export const DEV_SIGNED_OUT_SENTINEL = '__signed_out__';

export interface DevUserOption {
  email: string;
  label: string;
}
