import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";

/**
 * Cases table - stores case/project information
 */
export const cases = sqliteTable(
  "cases",
  {
    id: text("id").primaryKey().notNull(),
    title: text("title").notNull(),
    description: text("description"),
    userId: text("user_id").notNull(),
    status: text("status", {
      enum: ["draft", "active", "completed", "archived"],
    })
      .notNull()
      .default("draft"),
    priority: text("priority", { enum: ["low", "medium", "high"] }).default(
      "medium"
    ),
    dueDate: integer("due_date", { mode: "timestamp_ms" }),
    estimatedCost: real("estimated_cost"),
    actualCost: real("actual_cost"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast((julianday('now') - 2440587.5)*86400000 as integer))`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast((julianday('now') - 2440587.5)*86400000 as integer))`),
  },
  (table) => ({
    userIdIdx: index("user_id_idx").on(table.userId),
    statusIdx: index("status_idx").on(table.status),
  })
);

/**
 * Type exports for TypeScript support
 */
export type Case = typeof cases.$inferSelect;
export type NewCase = typeof cases.$inferInsert;
