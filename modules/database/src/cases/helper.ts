import { and, eq } from 'drizzle-orm';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import type { Database } from 'better-sqlite3';

import { cases, type NewCase, type Case } from './schema';
import { DatabaseError, Ok, Err, type Result } from '../types';

/**
 * CasesHelper class - wraps all case CRUD operations
 * Works with both Cloudflare D1 (production) and better-sqlite3 (local dev)
 */
export class CasesHelper {
  private db: DrizzleD1Database | Database;

  constructor(database: DrizzleD1Database | Database) {
    this.db = database;
  }

  /**
   * Create a new case
   */
  async insertCase(caseData: NewCase): Promise<Result<Case>> {
    try {
      const result = await this.db.insert(cases).values(caseData).returning();
      if (result.length === 0) {
        return Err(new DatabaseError('Failed to insert case'));
      }
      return Ok(result[0]);
    } catch (error) {
      return Err(new DatabaseError('Failed to insert case', 'INSERT_CASE_ERROR', error));
    }
  }

  /**
   * Get a single case by ID
   */
  async getCase(id: string): Promise<Result<Case | null>> {
    try {
      const result = await this.db.select().from(cases).where(eq(cases.id, id));
      return Ok(result.length > 0 ? result[0] : null);
    } catch (error) {
      return Err(new DatabaseError('Failed to fetch case', 'GET_CASE_ERROR', error));
    }
  }

  /**
   * Get all cases with optional filtering
   */
  async getAllCases(options?: { limit?: number; offset?: number; status?: string }): Promise<Result<Case[]>> {
    try {
      let query = this.db.select().from(cases);

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
      let query = this.db.select().from(cases).where(eq(cases.userId, userId));

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
      const result = await this.db
        .update(cases)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(cases.id, id))
        .returning();

      if (result.length === 0) {
        return Err(new DatabaseError('Case not found', 'CASE_NOT_FOUND'));
      }
      return Ok(result[0]);
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
        .where(
          and(eq(cases.userId, userId), eq(cases.status, status as 'draft' | 'active' | 'completed' | 'archived'))
        );

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
