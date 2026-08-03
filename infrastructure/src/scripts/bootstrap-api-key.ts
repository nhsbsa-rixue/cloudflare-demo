import { loadScriptEnv, requireEnv } from '../lib/env.ts';
import { runCommand } from '../lib/run.ts';

const { env, rootDir } = loadScriptEnv('BOOTSTRAP_ENV_FILE');

const apiToken = requireEnv(env, 'CLOUDFLARE_API_TOKEN');
const accountId = requireEnv(env, 'CF_ACCOUNT_ID');
const apiKeyValue = requireEnv(env, 'X_API_KEY');

const frontendProjectName = env.FRONTEND_PROJECT_NAME ?? 'cloudflare-demo-web';
const backendWorkerName = env.BACKEND_WORKER_NAME ?? 'cloudflare-demo-worker';
const apiKeySecretName = env.API_KEY_SECRET_NAME ?? 'x-api-key';

process.env.CLOUDFLARE_API_TOKEN = apiToken;
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
