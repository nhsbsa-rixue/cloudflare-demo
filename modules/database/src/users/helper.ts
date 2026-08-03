import { eq } from 'drizzle-orm';

import { users, type NewUser, type User } from './schema';
import { DatabaseError, Ok, Err, type Result, type AppDatabase } from '../types';
import { applyPagination, runQuery } from '../query-helpers';

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
    return runQuery('Failed to insert user', 'INSERT_USER_ERROR', async () => {
      const [inserted] = await this.db.insert(users).values(user).returning();
      return inserted ? Ok(inserted) : Err(new DatabaseError('Failed to insert user'));
    });
  }

  /**
   * Get a single user by ID
   */
  async getUser(id: string): Promise<Result<User | null>> {
    return runQuery('Failed to fetch user', 'GET_USER_ERROR', async () => {
      const [found] = await this.db.select().from(users).where(eq(users.id, id));
      return Ok(found ?? null);
    });
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<Result<User | null>> {
    return runQuery('Failed to fetch user by email', 'GET_USER_BY_EMAIL_ERROR', async () => {
      const [found] = await this.db.select().from(users).where(eq(users.email, email));
      return Ok(found ?? null);
    });
  }

  /**
   * Get all users with optional filtering
   */
  async getAllUsers(options?: { limit?: number; offset?: number }): Promise<Result<User[]>> {
    return runQuery('Failed to fetch all users', 'GET_ALL_USERS_ERROR', async () => {
      const query = applyPagination(this.db.select().from(users).$dynamic(), options);
      return Ok(await query);
    });
  }

  /**
   * Update a user
   */
  async updateUser(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<Result<User>> {
    return runQuery('Failed to update user', 'UPDATE_USER_ERROR', async () => {
      const [updated] = await this.db
        .update(users)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(users.id, id))
        .returning();

      return updated ? Ok(updated) : Err(new DatabaseError('User not found', 'USER_NOT_FOUND'));
    });
  }

  /**
   * Delete a user by ID
   */
  async deleteUser(id: string): Promise<Result<boolean>> {
    return runQuery('Failed to delete user', 'DELETE_USER_ERROR', async () => {
      await this.db.delete(users).where(eq(users.id, id));
      return Ok(true);
    });
  }
}
