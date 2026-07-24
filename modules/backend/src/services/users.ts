import { initializeDatabaseClient } from './db-client';
import type { CreateUserInput, Env, GetAllUsersOptions, UpdateUserInput } from '../types';
import { userIdGenerator } from '../../../utils';

/**
 * Users service layer with no HTTP transport dependencies.
 */
export class UsersService {
  private readonly db;

  constructor(env: Env) {
    this.db = initializeDatabaseClient(env);
  }

  async createUser(body: CreateUserInput) {
    return this.db.users.insertUser({
      id: userIdGenerator(),
      name: body.name,
      email: body.email,
      role: body.role ?? 'user'
    });
  }

  async getUser(id: string) {
    return this.db.users.getUser(id);
  }

  async getUserByEmail(email: string) {
    return this.db.users.getUserByEmail(email);
  }

  async getAllUsers(options?: GetAllUsersOptions) {
    return this.db.users.getAllUsers(options);
  }

  async updateUser(id: string, updates: UpdateUserInput) {
    return this.db.users.updateUser(id, updates);
  }

  async deleteUser(id: string) {
    return this.db.users.deleteUser(id);
  }
}
