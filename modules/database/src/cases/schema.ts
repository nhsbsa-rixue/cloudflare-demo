import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

/**
 * Cases table - stores case/project information
 */
export const cases = sqliteTable(
  'cases',
  {
    id: text('id').primaryKey().notNull(),
    userId: text('user_id').notNull(),
    imageUrl: text('image_url').notNull(),
    type: text('type', {
      enum: ['cnc', '3d', 'other']
    }).notNull(),
    status: text('status', {
      enum: ['draft', 'active', 'completed', 'archived']
    })
      .notNull()
      .default('draft'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(cast((julianday('now') - 2440587.5)*86400000 as integer))`),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(cast((julianday('now') - 2440587.5)*86400000 as integer))`)
  },
  (table) => [index('user_id_idx').on(table.userId), index('status_idx').on(table.status)]
);

/**
 * Type exports for TypeScript support
 */
export type Case = typeof cases.$inferSelect;
export type NewCase = typeof cases.$inferInsert;
