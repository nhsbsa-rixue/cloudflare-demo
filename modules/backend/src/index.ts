import type { Env } from './types';

const CORS_HEADERS: HeadersInit = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
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

    if (pathname === '/api/hello' && method === 'POST') {
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return Response.json({ error: 'Invalid JSON body' }, { status: 400, headers: CORS_HEADERS });
      }

      const username =
        typeof body === 'object' && body !== null && 'username' in body && typeof body.username === 'string'
          ? body.username.trim()
          : '';

      if (!username) {
        return Response.json({ error: 'username is required' }, { status: 400, headers: CORS_HEADERS });
      }

      return Response.json(
        {
          message: `hello ${username} welcome to this, the backend api is working`,
          timestamp: new Date().toISOString()
        },
        { headers: CORS_HEADERS }
      );
    }

    if (pathname === '/api/hello') {
      return Response.json({ error: 'Method Not Allowed' }, { status: 405, headers: CORS_HEADERS });
    }

    return Response.json({ error: 'Not Found' }, { status: 404, headers: CORS_HEADERS });
  }
} satisfies ExportedHandler<Env>;
