import { and, count, desc, eq, inArray, like } from 'drizzle-orm';

import { cases, type NewCase, type Case } from './schema';
import { users } from '../users/schema';
import { DatabaseError, Ok, Err, type Result, type AppDatabase } from '../types';

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
    try {
      const [inserted] = await this.db.insert(cases).values(caseData).returning();
      if (!inserted) {
        return Err(new DatabaseError('Failed to insert case'));
      }
      return Ok(inserted);
    } catch (error) {
      return Err(new DatabaseError('Failed to insert case', 'INSERT_CASE_ERROR', error));
    }
  }

  /**
   * Get a single case by ID
   */
  async getCase(id: string): Promise<Result<Case | null>> {
    try {
      const [found] = await this.db.select().from(cases).where(eq(cases.id, id));
      return Ok(found ?? null);
    } catch (error) {
      return Err(new DatabaseError('Failed to fetch case', 'GET_CASE_ERROR', error));
    }
  }

  /**
   * Get all cases with optional filtering
   */
  async getAllCases(options?: { limit?: number; offset?: number; status?: string }): Promise<Result<Case[]>> {
    try {
      let query = this.db.select().from(cases).$dynamic();

      if (options?.status) {
        query = query.where(eq(cases.status, options.status as 'draft' | 'active' | 'completed' | 'archived'));
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        query = query.offset(options.offset);
      }

      const result = await query;
      return Ok(result);
    } catch (error) {
      return Err(new DatabaseError('Failed to fetch all cases', 'GET_ALL_CASES_ERROR', error));
    }
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
    try {
      let query = this.db.select().from(cases).where(eq(cases.userId, userId)).$dynamic();

      if (options?.status) {
        query = query.where(
          and(
            eq(cases.userId, userId),
            eq(cases.status, options.status as 'draft' | 'active' | 'completed' | 'archived')
          )
        );
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        query = query.offset(options.offset);
      }

      const result = await query;
      return Ok(result);
    } catch (error) {
      return Err(new DatabaseError('Failed to fetch cases by user', 'GET_CASES_BY_USER_ERROR', error));
    }
  }

  /**
   * Update a case
   */
  async updateCase(id: string, updates: Partial<Omit<Case, 'id' | 'createdAt'>>): Promise<Result<Case>> {
    try {
      const [updated] = await this.db
        .update(cases)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(cases.id, id))
        .returning();

      if (!updated) {
        return Err(new DatabaseError('Case not found', 'CASE_NOT_FOUND'));
      }
      return Ok(updated);
    } catch (error) {
      return Err(new DatabaseError('Failed to update case', 'UPDATE_CASE_ERROR', error));
    }
  }

  /**
   * Delete a case by ID
   */
  async deleteCase(id: string): Promise<Result<boolean>> {
    try {
      await this.db.delete(cases).where(eq(cases.id, id));
      return Ok(true);
    } catch (error) {
      return Err(new DatabaseError('Failed to delete case', 'DELETE_CASE_ERROR', error));
    }
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
    if (search && search.trim()) {
      conditions.push(like(cases.id, `%${search.trim()}%`));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    try {
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
    } catch (error) {
      return Err(new DatabaseError('Failed to fetch cases with user', 'GET_CASES_WITH_USER_ERROR', error));
    }
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
    try {
      let query = this.db
        .select()
        .from(cases)
        .where(and(eq(cases.userId, userId), eq(cases.status, status as 'draft' | 'active' | 'completed' | 'archived')))
        .$dynamic();

      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        query = query.offset(options.offset);
      }

      const result = await query;
      return Ok(result);
    } catch (error) {
      return Err(
        new DatabaseError('Failed to fetch cases by user and status', 'GET_CASES_BY_USER_AND_STATUS_ERROR', error)
      );
    }
  }
}
