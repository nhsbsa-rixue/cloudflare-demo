import { eq } from 'drizzle-orm';

import { users, type NewUser, type User } from './schema';
import { DatabaseError, Ok, Err, type Result, type AppDatabase } from '../types';

/**
 * UsersHelper class - wraps all user CRUD operations
 * Works with both Cloudflare D1 (production) and better-sqlite3 (local dev)
 */
export class UsersHelper {
  private db: AppDatabase;

  constructor(database: AppDatabase) {
    this.db = database;
  }

  /**
   * Create a new user
   */
  async insertUser(user: NewUser): Promise<Result<User>> {
    try {
      const [inserted] = await this.db.insert(users).values(user).returning();
      if (!inserted) {
        return Err(new DatabaseError('Failed to insert user'));
      }
      return Ok(inserted);
    } catch (error) {
      return Err(new DatabaseError('Failed to insert user', 'INSERT_USER_ERROR', error));
    }
  }

  /**
   * Get a single user by ID
   */
  async getUser(id: string): Promise<Result<User | null>> {
    try {
      const [found] = await this.db.select().from(users).where(eq(users.id, id));
      return Ok(found ?? null);
    } catch (error) {
      return Err(new DatabaseError('Failed to fetch user', 'GET_USER_ERROR', error));
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<Result<User | null>> {
    try {
      const [found] = await this.db.select().from(users).where(eq(users.email, email));
      return Ok(found ?? null);
    } catch (error) {
      return Err(new DatabaseError('Failed to fetch user by email', 'GET_USER_BY_EMAIL_ERROR', error));
    }
  }

  /**
   * Get all users with optional filtering
   */
  async getAllUsers(options?: { limit?: number; offset?: number }): Promise<Result<User[]>> {
    try {
      let query = this.db.select().from(users).$dynamic();

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
      const [updated] = await this.db
        .update(users)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(users.id, id))
        .returning();

      if (!updated) {
        return Err(new DatabaseError('User not found', 'USER_NOT_FOUND'));
      }
      return Ok(updated);
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
