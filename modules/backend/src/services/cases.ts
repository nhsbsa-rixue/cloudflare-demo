import { initializeDatabaseClient } from './db-client';
import type { CreateCaseInput, Env, GetUserCasesOptions, ListCasesOptions, UpdateCaseInput } from '../types';

/**
 * Cases service layer with no HTTP transport dependencies.
 */
export class CasesService {
  private readonly db;

  constructor(env: Env) {
    this.db = initializeDatabaseClient(env);
  }

  async createCase(body: CreateCaseInput) {
    return this.db.cases.insertCase({
      id: body.id,
      userId: body.userId,
      imageUrl: body.imageUrl,
      type: body.type,
      status: body.status ?? 'draft'
    });
  }

  async getCase(id: string) {
    return this.db.cases.getCase(id);
  }

  async getUserCases(userId: string, options?: GetUserCasesOptions) {
    return this.db.cases.getCasesByUser(userId, options);
  }

  /** Paginated list of cases joined with owner email/name, for the dashboard. */
  async listCasesWithUser(options?: ListCasesOptions) {
    return this.db.cases.getCasesWithUser(options);
  }

  async updateCase(id: string, updates: UpdateCaseInput) {
    return this.db.cases.updateCase(id, updates);
  }

  async deleteCase(id: string) {
    return this.db.cases.deleteCase(id);
  }
}
