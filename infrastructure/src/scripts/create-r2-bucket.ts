import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { loadEnvFile, requireEnv } from '../lib/env.ts';
import { runCommand, runCommandOutput } from '../lib/run.ts';

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

requireEnv(env, 'CLOUDFLARE_API_TOKEN');
requireEnv(env, 'CF_ACCOUNT_ID');

const r2BucketName = env.R2_BUCKET_NAME ?? 'files';
const backendDir = env.BACKEND_DIR ?? path.join(rootDir, 'modules/backend');
const wranglerConfig = env.BACKEND_WRANGLER_CONFIG ?? path.join(backendDir, 'wrangler.jsonc');

function updateWranglerConfig(bucketName: string): void {
  let text = readFileSync(wranglerConfig, 'utf8');

  const bucketPattern = /("bucket_name"\s*:\s*")[^"]*(")/;
  if (!bucketPattern.test(text)) throw new Error(`Could not find bucket_name in ${wranglerConfig}`);

  text = text.replace(bucketPattern, `$1${bucketName}$2`);
  writeFileSync(wranglerConfig, text);
}

try {
  runCommandOutput('pnpm', ['exec', 'wrangler', 'r2', 'bucket', 'info', r2BucketName], { cwd: backendDir });
  console.log(`Found existing R2 bucket: ${r2BucketName}`);
} catch {
  console.log(`Creating R2 bucket: ${r2BucketName}`);
  runCommand('pnpm', ['exec', 'wrangler', 'r2', 'bucket', 'create', r2BucketName], { cwd: backendDir });
}

console.log(`Updating backend wrangler config: ${wranglerConfig}`);
updateWranglerConfig(r2BucketName);

console.log('');
console.log('Done');
console.log(`Bucket name: ${r2BucketName}`);
