import { initializeDatabaseClient } from './db-client';
import type { Env } from '../types';
import { caseIdGenerator } from '../../../utils';

function getErrorCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const maybeCode = (error as { code?: unknown }).code;
    return typeof maybeCode === 'string' ? maybeCode : undefined;
  }
  return undefined;
}

/**
 * POST /api/cases - Create a new case
 */
export async function createCaseHandler(request: Request, env: Env) {
  const db = initializeDatabaseClient(env);

  try {
    const body = (await request.json()) as {
      title: string;
      description?: string;
      userId: string;
      status?: 'draft' | 'active' | 'completed' | 'archived';
      priority?: 'low' | 'medium' | 'high';
      estimatedCost?: number;
    };

    const result = await db.cases.insertCase({
      id: caseIdGenerator(),
      userId: body.userId,
      status: (body.status as 'draft' | 'active' | 'completed' | 'archived') || 'draft',
      title: body.title,
      description: body.description,
      priority: body.priority,
      estimatedCost: body.estimatedCost
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

    return new Response(JSON.stringify({ case: result.value }), {
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
 * GET /api/cases/:id - Get a case by ID
 */
export async function getCaseHandler(_request: Request, env: Env, id: string) {
  const db = initializeDatabaseClient(env);

  const result = await db.cases.getCase(id);

  if (!result.ok) {
    return new Response(JSON.stringify({ error: result.error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!result.value) {
    return new Response(JSON.stringify({ error: 'Case not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ case: result.value }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * GET /api/users/:userId/cases - Get cases for a user
 */
export async function getUserCasesHandler(request: Request, env: Env, userId: string) {
  const db = initializeDatabaseClient(env);

  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '10', 10);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);
  const status = url.searchParams.get('status') ?? undefined;

  const result = await db.cases.getCasesByUser(userId, { limit, offset, status });

  if (!result.ok) {
    return new Response(JSON.stringify({ error: result.error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ cases: result.value }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * PUT /api/cases/:id - Update a case
 */
export async function updateCaseHandler(request: Request, env: Env, id: string) {
  const db = initializeDatabaseClient(env);

  try {
    const body = (await request.json()) as {
      title?: string;
      description?: string;
      userId?: string;
      status?: 'draft' | 'active' | 'completed' | 'archived';
      priority?: 'low' | 'medium' | 'high';
      dueDate?: number;
      estimatedCost?: number;
      actualCost?: number;
    };

    const updates = {
      ...body,
      dueDate: body.dueDate === undefined ? undefined : new Date(body.dueDate)
    };

    const result = await db.cases.updateCase(id, updates);

    if (!result.ok) {
      return new Response(
        JSON.stringify({
          error: result.error.message,
          code: getErrorCode(result.error)
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ case: result.value }), {
      status: 200,
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
 * DELETE /api/cases/:id - Delete a case
 */
export async function deleteCaseHandler(_request: Request, env: Env, id: string) {
  const db = initializeDatabaseClient(env);

  const result = await db.cases.deleteCase(id);

  if (!result.ok) {
    return new Response(JSON.stringify({ error: result.error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
