import type { UsersService } from './users';

const VALID_ROLES = new Set(['admin', 'user', 'operator', 'editor']);

export type AppRole = 'admin' | 'user' | 'operator' | 'editor';

export interface AuthenticatedActor {
  id: string;
  email: string;
  name: string;
  role: AppRole;
}

interface ResolveNewUserActorResult {
  actor?: AuthenticatedActor;
  errorMessage?: string;
}

function displayNameFromEmail(email: string): string {
  const [localPart = email] = email.split('@');
  return localPart.replace(/[._-]+/g, ' ');
}

function normalizeRole(value: string | null | undefined): AppRole {
  return value && VALID_ROLES.has(value) ? (value as AppRole) : 'user';
}

export async function resolveNewUserActor(
  usersService: UsersService,
  email: string
): Promise<ResolveNewUserActorResult> {
  const createResult = await usersService.createUser({
    email,
    name: displayNameFromEmail(email),
    role: 'user'
  });

  if (createResult.ok) {
    const created = createResult.value;
    return {
      actor: {
        id: created.id,
        email: created.email,
        name: created.name,
        role: normalizeRole(created.role)
      }
    };
  }

  // Handle duplicate insert races by re-reading the just-created account.
  const retryUser = await usersService.getUserByEmail(email);
  if (!retryUser.ok) {
    return { errorMessage: retryUser.error.message };
  }
  if (!retryUser.value) {
    return { errorMessage: createResult.error.message };
  }

  return {
    actor: {
      id: retryUser.value.id,
      email: retryUser.value.email,
      name: retryUser.value.name,
      role: normalizeRole(retryUser.value.role)
    }
  };
}
