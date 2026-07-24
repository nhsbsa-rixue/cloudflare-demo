import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { users } from '../users/schema';

/**
 * OAuth account mapping table.
 * One row links an internal user to a provider account (for example: google + sub).
 */
export const authAccounts = sqliteTable(
  'auth_accounts',
  {
    id: text('id').primaryKey().notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(cast((julianday('now') - 2440587.5)*86400000 as integer))`),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(cast((julianday('now') - 2440587.5)*86400000 as integer))`)
  },
  (table) => ({
    userIdIdx: index('auth_accounts_user_id_idx').on(table.userId),
    providerAccountUnique: uniqueIndex('auth_accounts_provider_account_unique').on(
      table.provider,
      table.providerAccountId
    )
  })
);

export type AuthAccount = typeof authAccounts.$inferSelect;
export type NewAuthAccount = typeof authAccounts.$inferInsert;
