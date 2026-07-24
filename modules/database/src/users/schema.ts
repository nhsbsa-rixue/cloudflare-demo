import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

/**
 * Users table - stores user information
 */
export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey().notNull(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    role: text('role').notNull().default('user'), // 'admin', 'user', 'editor'
    emailVerifiedAt: integer('email_verified_at', { mode: 'timestamp_ms' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(cast((julianday('now') - 2440587.5)*86400000 as integer))`),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(cast((julianday('now') - 2440587.5)*86400000 as integer))`)
  },
  (table) => ({
    emailIdx: index('email_idx').on(table.email)
  })
);

/**
 * Type exports for TypeScript support
 */
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
