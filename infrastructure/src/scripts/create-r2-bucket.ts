import path from 'node:path';

import { loadScriptEnv, requireEnv } from '../lib/env.ts';
import { runCommand, runCommandOutput } from '../lib/run.ts';
import { updateWranglerFields } from '../lib/wrangler.ts';

const { env, rootDir } = loadScriptEnv('BOOTSTRAP_ENV_FILE');

requireEnv(env, 'CLOUDFLARE_API_TOKEN');
requireEnv(env, 'CF_ACCOUNT_ID');

const r2BucketName = env.R2_BUCKET_NAME ?? 'files';
const backendDir = env.BACKEND_DIR ?? path.join(rootDir, 'modules/backend');
const wranglerConfig = env.BACKEND_WRANGLER_CONFIG ?? path.join(backendDir, 'wrangler.jsonc');

try {
  runCommandOutput('pnpm', ['exec', 'wrangler', 'r2', 'bucket', 'info', r2BucketName], { cwd: backendDir });
  console.log(`Found existing R2 bucket: ${r2BucketName}`);
} catch {
  console.log(`Creating R2 bucket: ${r2BucketName}`);
  runCommand('pnpm', ['exec', 'wrangler', 'r2', 'bucket', 'create', r2BucketName], { cwd: backendDir });
}

console.log(`Updating backend wrangler config: ${wranglerConfig}`);
updateWranglerFields(wranglerConfig, { bucket_name: r2BucketName });

console.log('');
console.log('Done');
console.log(`Bucket name: ${r2BucketName}`);
