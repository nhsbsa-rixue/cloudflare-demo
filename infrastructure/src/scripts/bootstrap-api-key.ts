import { existsSync } from 'node:fs';
import path from 'node:path';

import { loadEnvFile, requireEnv } from '../lib/env.ts';
import { runCommand } from '../lib/run.ts';

const packageDir = process.cwd();
const rootDir = path.resolve(packageDir, '..');
const envFile = process.argv[2] ?? process.env.BOOTSTRAP_ENV_FILE ?? path.join(rootDir, 'infrastructure/.env');

if (!existsSync(envFile)) {
  throw new Error(`Missing .env file: ${envFile}`);
}

const env = loadEnvFile(envFile);

for (const [key, value] of Object.entries(env)) {
  process.env[key] = value;
}

const apiToken = requireEnv(env, 'CF_API_TOKEN');
const accountId = requireEnv(env, 'CF_ACCOUNT_ID');
const apiKeyValue = requireEnv(env, 'X_API_KEY');

const frontendProjectName = env.FRONTEND_PROJECT_NAME ?? 'cloudflare-demo-web';
const backendWorkerName = env.BACKEND_WORKER_NAME ?? 'cloudflare-demo-worker';
const apiKeySecretName = env.API_KEY_SECRET_NAME ?? 'x-api-key';

process.env.CF_API_TOKEN = apiToken;
process.env.CF_ACCOUNT_ID = accountId;

console.log(`Updating Pages secret ${apiKeySecretName} for project ${frontendProjectName}`);
runCommand(
  'pnpm',
  [
    '--filter',
    '@cloudflare-demo/frontend',
    'exec',
    'wrangler',
    'pages',
    'secret',
    'put',
    apiKeySecretName,
    '--project-name',
    frontendProjectName
  ],
  { cwd: rootDir, input: `${apiKeyValue}\n` }
);

console.log(`Updating Worker secret ${apiKeySecretName} for worker ${backendWorkerName}`);
runCommand(
  'pnpm',
  [
    '--filter',
    '@cloudflare-demo/backend',
    'exec',
    'wrangler',
    'secret',
    'put',
    apiKeySecretName,
    '--name',
    backendWorkerName
  ],
  { cwd: rootDir, input: `${apiKeyValue}\n` }
);

console.log('');
console.log('Done');
console.log(`Secret name: ${apiKeySecretName}`);
console.log(`Pages project: ${frontendProjectName}`);
console.log(`Worker: ${backendWorkerName}`);
