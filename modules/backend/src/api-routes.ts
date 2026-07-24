/**
 * Example API routes for database operations
 * This file demonstrates how to use the DatabaseHelper in route handlers
 */

import { initializeDatabaseClient } from "../db-client";
import type { Env } from "../types";
import { generateId } from "@cloudflare-demo/utils";

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
      id: generateId(),
      name: body.name,
      email: body.email,
      role: body.role || "user",
    });

    if (!result.ok) {
      return new Response(
        JSON.stringify({
          error: result.error.message,
          code: result.error.code,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ user: result.value }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Invalid request",
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * GET /api/users/:id - Get a user by ID
 */
export async function getUserHandler(request: Request, env: Env, id: string) {
  const db = initializeDatabaseClient(env);

  const result = await db.users.getUser(id);

  if (!result.ok) {
    return new Response(
      JSON.stringify({ error: result.error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!result.value) {
    return new Response(
      JSON.stringify({ error: "User not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(JSON.stringify({ user: result.value }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * GET /api/users - Get all users
 */
export async function getAllUsersHandler(request: Request, env: Env) {
  const db = initializeDatabaseClient(env);

  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit") || "10");
  const offset = parseInt(url.searchParams.get("offset") || "0");

  const result = await db.users.getAllUsers({ limit, offset });

  if (!result.ok) {
    return new Response(
      JSON.stringify({ error: result.error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(JSON.stringify({ users: result.value }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
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
      status?: string;
      priority?: string;
      estimatedCost?: number;
    };

    const result = await db.cases.insertCase({
      id: generateId(),
      title: body.title,
      description: body.description,
      userId: body.userId,
      status: (body.status as any) || "draft",
      priority: (body.priority as any) || "medium",
      estimatedCost: body.estimatedCost,
    });

    if (!result.ok) {
      return new Response(
        JSON.stringify({
          error: result.error.message,
          code: result.error.code,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ case: result.value }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Invalid request",
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * GET /api/cases/:id - Get a case by ID
 */
export async function getCaseHandler(request: Request, env: Env, id: string) {
  const db = initializeDatabaseClient(env);

  const result = await db.cases.getCase(id);

  if (!result.ok) {
    return new Response(
      JSON.stringify({ error: result.error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!result.value) {
    return new Response(
      JSON.stringify({ error: "Case not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(JSON.stringify({ case: result.value }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * GET /api/users/:userId/cases - Get cases for a user
 */
export async function getUserCasesHandler(
  request: Request,
  env: Env,
  userId: string
) {
  const db = initializeDatabaseClient(env);

  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit") || "10");
  const offset = parseInt(url.searchParams.get("offset") || "0");
  const status = url.searchParams.get("status");

  const result = await db.cases.getCasesByUser(userId, { limit, offset, status });

  if (!result.ok) {
    return new Response(
      JSON.stringify({ error: result.error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(JSON.stringify({ cases: result.value }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * PUT /api/cases/:id - Update a case
 */
export async function updateCaseHandler(
  request: Request,
  env: Env,
  id: string
) {
  const db = initializeDatabaseClient(env);

  try {
    const body = (await request.json()) as any;

    const result = await db.cases.updateCase(id, body);

    if (!result.ok) {
      return new Response(
        JSON.stringify({
          error: result.error.message,
          code: result.error.code,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ case: result.value }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Invalid request",
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * DELETE /api/cases/:id - Delete a case
 */
export async function deleteCaseHandler(
  request: Request,
  env: Env,
  id: string
) {
  const db = initializeDatabaseClient(env);

  const result = await db.cases.deleteCase(id);

  if (!result.ok) {
    return new Response(
      JSON.stringify({ error: result.error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
