/**
 * Integration tests for the DB helpers against an in-memory SQLite database.
 *
 * These require the native `better-sqlite3` binding. In environments where that
 * binding is not built (the workspace sets `allowBuilds: better-sqlite3: false`),
 * the whole suite self-skips so the rest of the test run stays green.
 */
import { createRequire } from 'node:module';
import { beforeEach, describe, expect, it } from 'vitest';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { CasesHelper } from '../src/cases/helper';
import { UsersHelper } from '../src/users/helper';
import type { AppDatabase } from '../src/types';

const require = createRequire(import.meta.url);

let Database: (new (path: string) => { exec(sql: string): unknown; close(): void }) | null = null;
try {
  Database = require('better-sqlite3');
  const probe = new Database(':memory:');
  probe.close();
} catch {
  Database = null;
}

const SCHEMA = `
CREATE TABLE users (
  id text PRIMARY KEY NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  role text DEFAULT 'user' NOT NULL,
  email_verified_at integer,
  created_at integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
  updated_at integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
CREATE UNIQUE INDEX users_email_unique ON users (email);
CREATE TABLE cases (
  id text PRIMARY KEY NOT NULL,
  user_id text NOT NULL,
  image_url text NOT NULL,
  type text NOT NULL,
  status text DEFAULT 'draft' NOT NULL,
  created_at integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
  updated_at integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
`;

describe.skipIf(!Database)('DB helpers (better-sqlite3 integration)', () => {
  let users: UsersHelper;
  let cases: CasesHelper;

  beforeEach(() => {
    const Ctor = Database as NonNullable<typeof Database>;
    const sqlite = new Ctor(':memory:');
    sqlite.exec(SCHEMA);
    const db = drizzle(sqlite as never) as unknown as AppDatabase;
    users = new UsersHelper(db);
    cases = new CasesHelper(db);
  });

  it('creates and reads a user', async () => {
    const created = await users.insertUser({ id: 'u1', name: 'Ann', email: 'ann@x.com', role: 'user' });
    expect(created.ok).toBe(true);

    const byId = await users.getUser('u1');
    expect(byId.ok && byId.value?.email).toBe('ann@x.com');

    const byEmail = await users.getUserByEmail('ann@x.com');
    expect(byEmail.ok && byEmail.value?.id).toBe('u1');

    const missing = await users.getUser('nope');
    expect(missing.ok && missing.value).toBeNull();
  });

  it('returns USER_NOT_FOUND when updating a missing user', async () => {
    const res = await users.updateUser('ghost', { name: 'X' });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('USER_NOT_FOUND');
  });

  it('paginates users', async () => {
    for (let i = 0; i < 5; i++) {
      await users.insertUser({ id: `u${i}`, name: `N${i}`, email: `n${i}@x.com`, role: 'user' });
    }
    const page = await users.getAllUsers({ limit: 2, offset: 0 });
    expect(page.ok && page.value.length).toBe(2);
  });

  it('creates a case and joins the owner in getCasesWithUser', async () => {
    await users.insertUser({ id: 'u1', name: 'Ann', email: 'ann@x.com', role: 'user' });
    const created = await cases.insertCase({ id: 'c1', userId: 'u1', imageUrl: 'k.png', type: 'cnc', status: 'draft' });
    expect(created.ok).toBe(true);

    const joined = await cases.getCasesWithUser({ userId: 'u1', limit: 10, offset: 0 });
    expect(joined.ok).toBe(true);
    if (joined.ok) {
      expect(joined.value.total).toBe(1);
      expect(joined.value.cases[0]?.userEmail).toBe('ann@x.com');
    }
  });

  it('updates and deletes a case', async () => {
    await users.insertUser({ id: 'u1', name: 'Ann', email: 'ann@x.com', role: 'user' });
    await cases.insertCase({ id: 'c1', userId: 'u1', imageUrl: 'k.png', type: 'cnc', status: 'draft' });

    const updated = await cases.updateCase('c1', { status: 'active' });
    expect(updated.ok && updated.value.status).toBe('active');

    const del = await cases.deleteCase('c1');
    expect(del.ok && del.value).toBe(true);

    const gone = await cases.getCase('c1');
    expect(gone.ok && gone.value).toBeNull();
  });
});
