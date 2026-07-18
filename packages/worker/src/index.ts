import type { Env } from './types';

const CORS_HEADERS: HeadersInit = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json'
};

export default {
  async fetch(request: Request, _env: Env, _ctx: ExecutionContext): Promise<Response> {
    const { method, url } = request;
    const { pathname } = new URL(url);

    // Handle CORS preflight — required when web (port 5173) calls worker (port 8787)
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (pathname === '/api/hello' && method === 'GET') {
      return Response.json(
        {
          message: 'Hello from Cloudflare Worker!',
          timestamp: new Date().toISOString()
        },
        { headers: CORS_HEADERS }
      );
    }

    return Response.json({ error: 'Not Found' }, { status: 404, headers: CORS_HEADERS });
  }
} satisfies ExportedHandler<Env>;
