import { and, count, desc, eq, inArray, like } from 'drizzle-orm';

import { cases, type NewCase, type Case } from './schema';
import { users } from '../users/schema';
import { DatabaseError, Ok, Err, type Result, type AppDatabase } from '../types';
import { applyPagination, runQuery } from '../query-helpers';

/** Allowed case status values, shared by filter helpers. */
export type CaseStatus = 'draft' | 'active' | 'completed' | 'archived';

/** A case row enriched with the owning user's email and name (via join). */
export interface CaseWithUser {
  id: string;
  userId: string;
  userEmail: string | null;
  userName: string | null;
  imageUrl: string;
  type: 'cnc' | '3d' | 'other';
  status: CaseStatus;
  createdAt: Date;
  updatedAt: Date;
}

/** Options for the paginated {@link CasesHelper.getCasesWithUser} query. */
export interface GetCasesWithUserOptions {
  /** Restrict to these statuses (e.g. role-based visibility). Omit for all. */
  statuses?: CaseStatus[];
  /** Restrict to a single owner. Omit for all users. */
  userId?: string;
  /** Case-insensitive substring match against the case id. */
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * CasesHelper class - wraps all case CRUD operations
 * Works with both Cloudflare D1 (production) and better-sqlite3 (local dev)
 */
export class CasesHelper {
  private db: AppDatabase;

  constructor(database: AppDatabase) {
    this.db = database;
  }

  /**
   * Create a new case
   */
  async insertCase(caseData: NewCase): Promise<Result<Case>> {
    return runQuery('Failed to insert case', 'INSERT_CASE_ERROR', async () => {
      const [inserted] = await this.db.insert(cases).values(caseData).returning();
      return inserted ? Ok(inserted) : Err(new DatabaseError('Failed to insert case'));
    });
  }

  /**
   * Get a single case by ID
   */
  async getCase(id: string): Promise<Result<Case | null>> {
    return runQuery('Failed to fetch case', 'GET_CASE_ERROR', async () => {
      const [found] = await this.db.select().from(cases).where(eq(cases.id, id));
      return Ok(found ?? null);
    });
  }

  /**
   * Get all cases with optional filtering
   */
  async getAllCases(options?: { limit?: number; offset?: number; status?: string }): Promise<Result<Case[]>> {
    return runQuery('Failed to fetch all cases', 'GET_ALL_CASES_ERROR', async () => {
      let query = this.db.select().from(cases).$dynamic();

      if (options?.status) {
        query = query.where(eq(cases.status, options.status as CaseStatus));
      }

      query = applyPagination(query, options);
      return Ok(await query);
    });
  }

  /**
   * Get cases by user ID
   */
  async getCasesByUser(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      status?: string;
    }
  ): Promise<Result<Case[]>> {
    return runQuery('Failed to fetch cases by user', 'GET_CASES_BY_USER_ERROR', async () => {
      let query = this.db.select().from(cases).where(eq(cases.userId, userId)).$dynamic();

      if (options?.status) {
        query = query.where(and(eq(cases.userId, userId), eq(cases.status, options.status as CaseStatus)));
      }

      query = applyPagination(query, options);
      return Ok(await query);
    });
  }

  /**
   * Update a case
   */
  async updateCase(id: string, updates: Partial<Omit<Case, 'id' | 'createdAt'>>): Promise<Result<Case>> {
    return runQuery('Failed to update case', 'UPDATE_CASE_ERROR', async () => {
      const [updated] = await this.db
        .update(cases)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(cases.id, id))
        .returning();

      return updated ? Ok(updated) : Err(new DatabaseError('Case not found', 'CASE_NOT_FOUND'));
    });
  }

  /**
   * Delete a case by ID
   */
  async deleteCase(id: string): Promise<Result<boolean>> {
    return runQuery('Failed to delete case', 'DELETE_CASE_ERROR', async () => {
      await this.db.delete(cases).where(eq(cases.id, id));
      return Ok(true);
    });
  }

  /**
   * Get a paginated list of cases joined with their owning user's email/name.
   *
   * Supports role-based status filtering, owner filtering, and a case-id search.
   * Returns both the page of rows and the total count matching the filters so
   * callers can render pagination controls.
   */
  async getCasesWithUser(
    options: GetCasesWithUserOptions = {}
  ): Promise<Result<{ cases: CaseWithUser[]; total: number }>> {
    const { statuses, userId, search, limit, offset } = options;

    const conditions = [];
    if (statuses && statuses.length > 0) {
      conditions.push(inArray(cases.status, statuses));
    }
    if (userId) {
      conditions.push(eq(cases.userId, userId));
    }
    if (search?.trim()) {
      conditions.push(like(cases.id, `%${search.trim()}%`));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return runQuery('Failed to fetch cases with user', 'GET_CASES_WITH_USER_ERROR', async () => {
      let query = this.db
        .select({
          id: cases.id,
          userId: cases.userId,
          userEmail: users.email,
          userName: users.name,
          imageUrl: cases.imageUrl,
          type: cases.type,
          status: cases.status,
          createdAt: cases.createdAt,
          updatedAt: cases.updatedAt
        })
        .from(cases)
        .leftJoin(users, eq(cases.userId, users.id))
        .where(whereClause)
        .orderBy(desc(cases.createdAt))
        .$dynamic();

      if (typeof limit === 'number') {
        query = query.limit(limit);
      }
      if (typeof offset === 'number') {
        query = query.offset(offset);
      }

      const rows = await query;

      const [totals] = await this.db.select({ value: count() }).from(cases).where(whereClause);

      return Ok({ cases: rows, total: totals?.value ?? 0 });
    });
  }

  /**
   * Get cases for user with status filter
   */
  async getCasesByUserAndStatus(
    userId: string,
    status: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<Result<Case[]>> {
    return runQuery('Failed to fetch cases by user and status', 'GET_CASES_BY_USER_AND_STATUS_ERROR', async () => {
      let query = this.db
        .select()
        .from(cases)
        .where(and(eq(cases.userId, userId), eq(cases.status, status as CaseStatus)))
        .$dynamic();

      query = applyPagination(query, options);
      return Ok(await query);
    });
  }
}
