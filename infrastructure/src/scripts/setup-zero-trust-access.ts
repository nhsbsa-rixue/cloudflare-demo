import Cloudflare from 'cloudflare';

import { loadScriptEnv, requireEnv } from '../lib/env.ts';

const { env } = loadScriptEnv('ACCESS_ENV_FILE');

const apiToken = requireEnv(env, 'CLOUDFLARE_API_TOKEN');
const accountId = requireEnv(env, 'CF_ACCOUNT_ID');
const appDomain = requireEnv(env, 'ACCESS_APP_DOMAIN');

const appName = env.ACCESS_APP_NAME ?? 'cloudflare-demo-web-access';
const policyName = env.ACCESS_POLICY_NAME ?? 'allow-all-users';
const sessionDuration = env.ACCESS_SESSION_DURATION ?? '24h';
const autoRedirect = (env.ACCESS_AUTO_REDIRECT ?? 'false') === 'true';
const protectedPathList = parseProtectedPaths(env.ACCESS_PROTECTED_PATHS ?? '/upload,/dashboard,/design,/api/files');
const existingAppIds = parseExistingAppIds(env.ACCESS_APP_IDS ?? env.APP_ID ?? '');

const client = new Cloudflare({ apiToken });

const policyPayload = {
  name: policyName,
  decision: 'allow' as const,
  precedence: 1,
  // Allow any OTP-verified email; the D1 users table is the sole whitelist.
  include: [{ everyone: {} }] as [{ everyone: Record<string, never> }],
  exclude: [] as never[],
  require: [] as never[]
};

function normalizePath(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

  let end = withLeadingSlash.length;
  while (end > 0 && withLeadingSlash.codePointAt(end - 1) === 47) {
    end -= 1;
  }

  return withLeadingSlash.slice(0, end) || '/';
}

function parseProtectedPaths(value: string): string[] {
  const seen = new Set<string>();

  for (const rawPath of value.split(',')) {
    const normalizedPath = normalizePath(rawPath);
    if (normalizedPath) {
      seen.add(normalizedPath);
    }
  }

  if (seen.size === 0) {
    throw new Error('ACCESS_PROTECTED_PATHS must define at least one protected path.');
  }

  return [...seen];
}

function parseExistingAppIds(value: string): Map<string, string> {
  const mappings = new Map<string, string>();
  const trimmed = value.trim();
  if (!trimmed) {
    return mappings;
  }

  if (!trimmed.includes('=')) {
    mappings.set('*', trimmed);
    return mappings;
  }

  for (const entry of trimmed.split(',')) {
    const [rawPath, rawId] = entry.split('=', 2);
    const normalizedPath = normalizePath(rawPath ?? '');
    const appId = rawId?.trim() ?? '';
    if (normalizedPath && appId) {
      mappings.set(normalizedPath, appId);
    }
  }

  return mappings;
}

function buildAppDomain(hostname: string, protectedPath: string): string {
  let end = hostname.length;
  while (end > 0 && hostname.codePointAt(end - 1) === 47) {
    end -= 1;
  }

  return `${hostname.slice(0, end)}${protectedPath}`;
}

function buildAppName(baseName: string, protectedPath: string): string {
  if (protectedPath === '/') {
    return `${baseName}-root`;
  }

  let slug = protectedPath.slice(1).replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+/g, '');

  let end = slug.length;
  while (end > 0 && slug.codePointAt(end - 1) === 45) {
    end -= 1;
  }
  slug = slug.slice(0, end);

  return slug ? `${baseName}-${slug}` : baseName;
}

async function resolveExistingAppId(domain: string, configuredAppId: string): Promise<string> {
  if (configuredAppId) {
    console.log(`Using configured app id for ${domain}: ${configuredAppId}`);
    await client.zeroTrust.access.applications.get(configuredAppId, { account_id: accountId });
    return configuredAppId;
  }

  for await (const app of client.zeroTrust.access.applications.list({ account_id: accountId })) {
    const existingApp = app as { id?: string; domain?: string };
    if (existingApp.domain === domain && existingApp.id) {
      return existingApp.id;
    }
  }

  return '';
}

// Removes leftover domain-wide apps (no path) that would gate the public home page.
async function removeDomainWideApps(): Promise<void> {
  for await (const app of client.zeroTrust.access.applications.list({ account_id: accountId })) {
    const a = app as { id?: string; domain?: string; name?: string };
    if (a.domain === appDomain && a.id) {
      console.log(`Removing domain-wide Access app: ${a.name ?? a.id} (${a.domain})`);
      await client.zeroTrust.access.applications.delete(a.id, { account_id: accountId });
    }
  }
}

async function upsertPolicy(appId: string): Promise<void> {
  console.log(`Resolving policy by name for app ${appId}: ${policyName}`);

  let policyId = '';
  const policies: Array<{ id?: string; name?: string }> = [];

  for await (const policy of client.zeroTrust.access.applications.policies.list(appId, { account_id: accountId })) {
    policies.push(policy);
    if (policy.name === policyName && policy.id) {
      policyId = policy.id;
    }
  }

  if (!policyId && policies.length === 1 && policies[0].id) {
    policyId = policies[0].id;
    console.log(`No policy name match found; updating existing single policy: ${policyId}`);
  }

  if (policyId) {
    console.log(`Updating existing policy: ${policyId}`);
    await client.zeroTrust.access.applications.policies.update(appId, policyId, {
      account_id: accountId,
      ...policyPayload
    });
    return;
  }

  console.log('Creating new policy');
  await client.zeroTrust.access.applications.policies.create(appId, {
    account_id: accountId,
    ...policyPayload
  });
}

console.log(`Configuring path-scoped Access apps for hostname: ${appDomain}`);
console.log(`Protected paths: ${protectedPathList.join(', ')}`);

await removeDomainWideApps();

const provisionedApps: Array<{ appId: string; name: string; domain: string }> = [];

for (const protectedPath of protectedPathList) {
  const scopedDomain = buildAppDomain(appDomain, protectedPath);
  const scopedName = buildAppName(appName, protectedPath);
  const configuredAppId = existingAppIds.get(protectedPath) ?? existingAppIds.get('*') ?? '';

  console.log(`Checking existing Access app for protected path: ${scopedDomain}`);

  const appId = await resolveExistingAppId(scopedDomain, configuredAppId);
  const appPayload = {
    name: scopedName,
    type: 'self_hosted' as const,
    domain: scopedDomain,
    session_duration: sessionDuration,
    auto_redirect_to_identity: autoRedirect
  };

  if (appId) {
    console.log(`Access app already exists. Updating app settings for: ${appId}`);
    await client.zeroTrust.access.applications.update(appId, { account_id: accountId, ...appPayload });
    await upsertPolicy(appId);
    provisionedApps.push({ appId, name: scopedName, domain: scopedDomain });
    continue;
  }

  console.log(`Creating new Access app: ${scopedName}`);
  const created = await client.zeroTrust.access.applications.create({ account_id: accountId, ...appPayload });
  if (!created.id) {
    throw new Error(`Failed to create Access app for ${scopedDomain}.`);
  }

  await upsertPolicy(created.id);
  provisionedApps.push({ appId: created.id, name: scopedName, domain: scopedDomain });
}

console.log('');
console.log('Done');
console.log(`Hostname: ${appDomain}`);
console.log(`Policy:   ${policyName}`);
console.log('Protected paths:');

for (const app of provisionedApps) {
  console.log(`- ${app.domain}`);
  console.log(`  App ID: ${app.appId}`);
  console.log(`  Name:   ${app.name}`);
}

console.log('Public paths are left outside Cloudflare Access and must be handled by the application layer.');
console.log('Policy: allow everyone (D1 whitelist enforced at app layer)');
