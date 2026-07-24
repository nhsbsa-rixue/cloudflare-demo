import { eq } from 'drizzle-orm';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import type { Database } from 'better-sqlite3';

import { users, type NewUser, type User } from './schema';
import { DatabaseError, Ok, Err, type Result } from '../types';

/**
 * UsersHelper class - wraps all user CRUD operations
 * Works with both Cloudflare D1 (production) and better-sqlite3 (local dev)
 */
export class UsersHelper {
  private db: DrizzleD1Database | Database;

  constructor(database: DrizzleD1Database | Database) {
    this.db = database;
  }

  /**
   * Create a new user
   */
  async insertUser(user: NewUser): Promise<Result<User>> {
    try {
      const result = await this.db.insert(users).values(user).returning();
      if (result.length === 0) {
        return Err(new DatabaseError('Failed to insert user'));
      }
      return Ok(result[0]);
    } catch (error) {
      return Err(new DatabaseError('Failed to insert user', 'INSERT_USER_ERROR', error));
    }
  }

  /**
   * Get a single user by ID
   */
  async getUser(id: string): Promise<Result<User | null>> {
    try {
      const result = await this.db.select().from(users).where(eq(users.id, id));
      return Ok(result.length > 0 ? result[0] : null);
    } catch (error) {
      return Err(new DatabaseError('Failed to fetch user', 'GET_USER_ERROR', error));
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<Result<User | null>> {
    try {
      const result = await this.db.select().from(users).where(eq(users.email, email));
      return Ok(result.length > 0 ? result[0] : null);
    } catch (error) {
      return Err(new DatabaseError('Failed to fetch user by email', 'GET_USER_BY_EMAIL_ERROR', error));
    }
  }

  /**
   * Get all users with optional filtering
   */
  async getAllUsers(options?: { limit?: number; offset?: number }): Promise<Result<User[]>> {
    try {
      let query = this.db.select().from(users);

      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        query = query.offset(options.offset);
      }

      const result = await query;
      return Ok(result);
    } catch (error) {
      return Err(new DatabaseError('Failed to fetch all users', 'GET_ALL_USERS_ERROR', error));
    }
  }

  /**
   * Update a user
   */
  async updateUser(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<Result<User>> {
    try {
      const result = await this.db
        .update(users)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(users.id, id))
        .returning();

      if (result.length === 0) {
        return Err(new DatabaseError('User not found', 'USER_NOT_FOUND'));
      }
      return Ok(result[0]);
    } catch (error) {
      return Err(new DatabaseError('Failed to update user', 'UPDATE_USER_ERROR', error));
    }
  }

  /**
   * Delete a user by ID
   */
  async deleteUser(id: string): Promise<Result<boolean>> {
    try {
      await this.db.delete(users).where(eq(users.id, id));
      return Ok(true);
    } catch (error) {
      return Err(new DatabaseError('Failed to delete user', 'DELETE_USER_ERROR', error));
    }
  }
}
