import { existsSync } from 'node:fs';
import path from 'node:path';

import Cloudflare from 'cloudflare';

import { loadEnvFile, requireEnv } from '../lib/env.ts';

const packageDir = process.cwd();
const rootDir = path.resolve(packageDir, '../..');
const envFile = process.argv[2] ?? process.env.ACCESS_ENV_FILE ?? path.join(rootDir, 'infrastructure/.env');

if (!existsSync(envFile)) {
  throw new Error(`Missing .env file: ${envFile}`);
}

const env = loadEnvFile(envFile);

for (const [key, value] of Object.entries(env)) {
  process.env[key] = value;
}

const apiToken = requireEnv(env, 'CF_API_TOKEN');
const accountId = requireEnv(env, 'CF_ACCOUNT_ID');
const appDomain = requireEnv(env, 'ACCESS_APP_DOMAIN');

const appName = env.ACCESS_APP_NAME ?? 'cloudflare-demo-web-access';
const policyName = env.ACCESS_POLICY_NAME ?? 'allow-invited-users';
const sessionDuration = env.ACCESS_SESSION_DURATION ?? '24h';
const autoRedirect = (env.ACCESS_AUTO_REDIRECT ?? 'false') === 'true';
const existingAppId = env.APP_ID ?? '';

const client = new Cloudflare({ apiToken });

const appPayload = {
  name: appName,
  type: 'self_hosted' as const,
  domain: appDomain,
  session_duration: sessionDuration,
  auto_redirect_to_identity: autoRedirect
};

const policyPayload = {
  name: policyName,
  decision: 'allow' as const,
  precedence: 1,
  // Allow any OTP-verified email; the D1 users table is the sole whitelist.
  include: [{ everyone: {} }] as [{ everyone: Record<string, never> }],
  exclude: [] as never[],
  require: [] as never[]
};

console.log(`Checking existing Access app for domain: ${appDomain}`);

let appId: string;

if (existingAppId) {
  console.log(`Using APP_ID from .env: ${existingAppId}`);
  await client.zeroTrust.access.applications.get(existingAppId, { account_id: accountId });
  appId = existingAppId;
  console.log(`Access app already exists. Updating app settings for: ${appId}`);
  await client.zeroTrust.access.applications.update(appId, { account_id: accountId, ...appPayload });
} else {
  let foundAppId = '';
  for await (const app of client.zeroTrust.access.applications.list({ account_id: accountId })) {
    const a = app as { id?: string; domain?: string };
    if (a.domain === appDomain && a.id) {
      foundAppId = a.id;
      break;
    }
  }

  if (foundAppId) {
    appId = foundAppId;
    console.log(`Access app already exists. Updating app settings for: ${appId}`);
    await client.zeroTrust.access.applications.update(appId, { account_id: accountId, ...appPayload });
  } else {
    console.log(`Creating new Access app: ${appName}`);
    const created = await client.zeroTrust.access.applications.create({ account_id: accountId, ...appPayload });
    if (!created.id) throw new Error('Failed to create Access app.');
    appId = created.id;
  }
}

console.log(`Resolving policy by name: ${policyName}`);

let policyId = '';
const policies: Array<{ id?: string; name?: string }> = [];

for await (const p of client.zeroTrust.access.applications.policies.list(appId, { account_id: accountId })) {
  policies.push(p);
  if (p.name === policyName && p.id) {
    policyId = p.id;
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
} else {
  console.log('Creating new policy');
  await client.zeroTrust.access.applications.policies.create(appId, {
    account_id: accountId,
    ...policyPayload
  });
}

console.log('');
console.log('Done');
console.log(`App ID:    ${appId}`);
console.log(`Domain:    ${appDomain}`);
console.log(`App name:  ${appName}`);
console.log(`Policy:    ${policyName}`);
console.log('Policy:    allow everyone (D1 whitelist enforced at app layer)');
