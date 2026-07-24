# Database Module (@cloudflare-demo/database)

This module provides database layer management using Drizzle ORM with D1 (Cloudflare Workers SQLite) support.

## Overview

- **Schema**: Defines `users` and `cases` tables
- **Helper Class**: `DatabaseHelper` wraps all CRUD operations
- **Type Safety**: Full TypeScript support with type-safe error handling
- **D1 Compatible**: Works with Cloudflare D1 for production
- **Local Dev**: Uses better-sqlite3 for local development

## Installation & Setup

### 1. Install Dependencies

From the root workspace directory:

```bash
pnpm install
```

This installs Drizzle ORM, better-sqlite3, and other dependencies for the database module.

### 2. Create D1 Database

For production deployment, create a D1 database in Cloudflare:

```bash
cd modules/backend
pnpm run wrangler d1 create demo-db
```

This will return a `database_id`. Update `wrangler.jsonc`:

```jsonc
"d1_databases": [
  {
    "binding": "UPLOADS_DB",
    "database_name": "demo-db",
    "database_id": "YOUR_DATABASE_ID_HERE"
  }
]
```

### 3. Generate Migrations

Generate SQL migrations from the schema:

```bash
cd modules/database
pnpm run migrate:generate
```

This creates migration files in the `drizzle/` directory based on your schema.

### 4. Run Migrations Locally

For local development with better-sqlite3:

```bash
cd modules/database
pnpm run migrate:local
```

This creates `demo-db.db` file locally and applies all migrations.

## Usage in Backend

### Basic Example

```typescript
import { getDatabaseClient } from "./db-client";
import type { Env } from "./types";

export default {
  async fetch(request: Request, env: Env) {
    const db = getDatabaseClient(env);

    // Create a user
    const userResult = await db.insertUser({
      id: "user-1",
      name: "John Doe",
      email: "john@example.com",
      role: "user",
    });

    if (!userResult.ok) {
      return new Response(
        JSON.stringify({ error: userResult.error.message }),
        { status: 400 }
      );
    }

    // Fetch the user
    const fetchResult = await db.getUser("user-1");
    if (!fetchResult.ok) {
      return new Response(
        JSON.stringify({ error: fetchResult.error.message }),
        { status: 400 }
      );
    }

    return new Response(
      JSON.stringify({
        user: fetchResult.value,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  },
};
```

## API Reference

### Users Operations

```typescript
// Create user
const result = await db.insertUser(newUser);

// Get user by ID
const result = await db.getUser(userId);

// Get user by email
const result = await db.getUserByEmail(email);

// Get all users
const result = await db.getAllUsers({ limit: 10, offset: 0 });

// Update user
const result = await db.updateUser(userId, { name: "New Name" });

// Delete user
const result = await db.deleteUser(userId);
```

### Cases Operations

```typescript
// Create case
const result = await db.insertCase(newCase);

// Get case by ID
const result = await db.getCase(caseId);

// Get all cases
const result = await db.getAllCases({ limit: 10, status: "active" });

// Get cases by user
const result = await db.getCasesByUser(userId, { limit: 10, status: "active" });

// Get cases by user and status
const result = await db.getCasesByUserAndStatus(userId, "active", { limit: 10 });

// Update case
const result = await db.updateCase(caseId, { status: "completed" });

// Delete case
const result = await db.deleteCase(caseId);
```

### Utility Operations

```typescript
// Get database statistics
const result = await db.getStats();
```

## Result Type Pattern

All operations return a `Result<T>` type that can be either success or error:

```typescript
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };
```

Handle results safely:

```typescript
const result = await db.getUser("user-1");

if (result.ok) {
  console.log("User found:", result.value);
} else {
  console.error("Error:", result.error.message);
}
```

## Migrations for D1 Production

D1 does not support automatic migration runs. To apply migrations in production:

1. **Manual via Dashboard**: Go to Cloudflare Dashboard > D1 > Your Database > Console and run SQL manually
2. **Via Wrangler CLI**: Use wrangler to execute migrations (requires wrangler D1 commands)
3. **In Worker Startup**: Add migration logic in your worker (advanced, not recommended)

For now, use the SQL files in `/drizzle` folder and apply them manually via Cloudflare Dashboard.

## Schema

### Users Table

| Column    | Type      | Notes                          |
| --------- | --------- | ------------------------------ |
| id        | TEXT      | Primary Key                    |
| name      | TEXT      | User name                      |
| email     | TEXT      | Unique email address           |
| role      | TEXT      | 'admin', 'user', 'editor'      |
| createdAt | INTEGER   | Timestamp in milliseconds      |
| updatedAt | INTEGER   | Timestamp in milliseconds      |

### Cases Table

| Column       | Type      | Notes                                  |
| ------------ | --------- | -------------------------------------- |
| id           | TEXT      | Primary Key                            |
| title        | TEXT      | Case title                             |
| description  | TEXT      | Optional description                   |
| userId       | TEXT      | Foreign key to users table             |
| status       | TEXT      | 'draft', 'active', 'completed', 'archived' |
| priority     | TEXT      | 'low', 'medium', 'high'                |
| dueDate      | INTEGER   | Optional due date (timestamp)          |
| estimatedCost | REAL     | Optional estimated cost                |
| actualCost   | REAL      | Optional actual cost                   |
| createdAt    | INTEGER   | Timestamp in milliseconds              |
| updatedAt    | INTEGER   | Timestamp in milliseconds              |

## Type Exports

```typescript
// Schema types
import type { User, NewUser, Case, NewCase } from "@cloudflare-demo/database";

// Helper and utilities
import { DatabaseHelper, DatabaseError, Ok, Err } from "@cloudflare-demo/database";
import type { Result } from "@cloudflare-demo/database";
```

## Testing

Run tests:

```bash
cd modules/database
pnpm run test
```

Watch mode:

```bash
cd modules/database
pnpm run test:watch
```

## Troubleshooting

### "Cannot find module" errors

Ensure dependencies are installed:

```bash
pnpm install
```

And build the database module:

```bash
cd modules/database
pnpm run build
```

### D1 binding not found in worker

Check that:
1. `wrangler.jsonc` includes the D1 binding with correct `database_id`
2. `types.ts` in backend includes `UPLOADS_DB: D1Database` in `Env` interface
3. Backend package.json has `drizzle-orm` dependency

### Local migrations failing

Ensure better-sqlite3 is installed:

```bash
cd modules/database
pnpm install
```

And verify the `drizzle.config.ts` points to correct database file location.

## Files Structure

```
modules/database/
├── src/
│   ├── schema.ts          # Drizzle table definitions
│   ├── db-helper.ts       # DatabaseHelper class (main CRUD wrapper)
│   ├── types.ts           # Type definitions and utilities
│   └── index.ts           # Public exports
├── drizzle/               # Generated migrations and production SQL source
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── drizzle.config.ts      # Drizzle Kit configuration
```

## Next Steps

1. Build and test the database module: `cd modules/database && pnpm build`
2. Create D1 database in Cloudflare: `cd modules/backend && pnpm run wrangler d1 create demo-db`
3. Update backend wrangler.jsonc with the database_id
4. Generate migrations: `cd modules/database && pnpm run migrate:generate`
5. Apply migrations locally: `cd modules/database && pnpm run migrate:local`
6. Start using DatabaseHelper in your worker routes!
