import { initializeDatabaseClient } from './db-client';
import type { Env } from '../types';
import { userIdGenerator } from '../../../utils';

function getErrorCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const maybeCode = (error as { code?: unknown }).code;
    return typeof maybeCode === 'string' ? maybeCode : undefined;
  }
  return undefined;
}

/**
 * POST /api/users - Create a new user
 */
export async function createUserHandler(request: Request, env: Env) {
  const db = initializeDatabaseClient(env);

  try {
    const body = (await request.json()) as {
      name: string;
      email: string;
      role?: string;
    };

    const result = await db.users.insertUser({
      id: userIdGenerator(),
      name: body.name,
      email: body.email,
      role: body.role || 'user'
    });

    if (!result.ok) {
      return new Response(
        JSON.stringify({
          error: result.error.message,
          code: getErrorCode(result.error)
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ user: result.value }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Invalid request',
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * GET /api/users/:id - Get a user by ID
 */
export async function getUserHandler(_request: Request, env: Env, id: string) {
  const db = initializeDatabaseClient(env);

  const result = await db.users.getUser(id);

  if (!result.ok) {
    return new Response(JSON.stringify({ error: result.error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!result.value) {
    return new Response(JSON.stringify({ error: 'User not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ user: result.value }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * GET /api/users - Get all users
 */
export async function getAllUsersHandler(request: Request, env: Env) {
  const db = initializeDatabaseClient(env);

  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '10', 10);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);

  const result = await db.users.getAllUsers({ limit, offset });

  if (!result.ok) {
    return new Response(JSON.stringify({ error: result.error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ users: result.value }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
