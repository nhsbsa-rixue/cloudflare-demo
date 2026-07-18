// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

// Import Cloudflare Workers types for full runtime type coverage.
// Add specific binding types (KVNamespace, D1Database, R2Bucket, etc.) as needed.
import type { IncomingRequestCfProperties } from '@cloudflare/workers-types';

declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface PageState {}

    interface Platform {
      /**
       * Cloudflare bindings — add your KV/D1/R2/etc. types here and in wrangler.jsonc.
       *
       * Example:
       *   import type { KVNamespace, D1Database } from '@cloudflare/workers-types';
       *   MY_KV: KVNamespace;
       *   MY_DB: D1Database;
       */
      env: Record<string, unknown> & {
        WORKER?: Fetcher;
      };

      /** Schedule work to outlive the response via the Cloudflare execution context. */
      context: {
        waitUntil(promise: Promise<unknown>): void;
      };

      /** Cloudflare Cache API. */
      caches: CacheStorage & { default: Cache };

      /** Cloudflare-specific request metadata (geo, ASN, TLS info, etc.). */
      cf?: IncomingRequestCfProperties;
    }
  }
}

// biome-ignore lint/complexity/noUselessEmptyExport: required to make this file a module so declare global works
export {};
