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

const d1DatabaseName = env.D1_DATABASE_NAME ?? 'demo-db';
const d1BindingName = env.D1_BINDING_NAME ?? 'UPLOADS_DB';
const backendDir = env.BACKEND_DIR ?? path.join(rootDir, 'modules/backend');
const wranglerConfig = env.BACKEND_WRANGLER_CONFIG ?? path.join(backendDir, 'wrangler.jsonc');

const uuidPattern = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}/;

function extractUuid(output: string): string {
  const match = uuidPattern.exec(output);
  if (!match) {
    throw new Error('Could not extract UUID from wrangler output');
  }
  return match[0];
}

function updateWranglerConfig(databaseId: string): void {
  let text = readFileSync(wranglerConfig, 'utf8');

  const namePattern = /("database_name"\s*:\s*")[^"]*(")/;
  const idPattern = /("database_id"\s*:\s*")[^"]*(")/;

  if (!namePattern.test(text)) throw new Error(`Could not find database_name in ${wranglerConfig}`);
  if (!idPattern.test(text)) throw new Error(`Could not find database_id in ${wranglerConfig}`);

  text = text.replace(namePattern, `$1${d1DatabaseName}$2`);
  text = text.replace(idPattern, `$1${databaseId}$2`);
  writeFileSync(wranglerConfig, text);
}

let databaseId: string;

try {
  const infoOutput = runCommandOutput('pnpm', ['exec', 'wrangler', 'd1', 'info', d1DatabaseName], { cwd: backendDir });
  databaseId = extractUuid(infoOutput);
  console.log(`Found existing D1 database: ${d1DatabaseName}`);
} catch {
  console.log(`Creating D1 database: ${d1DatabaseName}`);
  const createOutput = runCommandOutput(
    'pnpm',
    ['exec', 'wrangler', 'd1', 'create', d1DatabaseName, '--binding', d1BindingName],
    { cwd: backendDir }
  );
  databaseId = extractUuid(createOutput);
}

console.log(`Updating backend wrangler config: ${wranglerConfig}`);
updateWranglerConfig(databaseId);

console.log(`Applying remote migrations for ${d1DatabaseName}`);
runCommand('pnpm', ['exec', 'wrangler', 'd1', 'migrations', 'apply', d1DatabaseName, '--remote'], {
  cwd: backendDir
});

console.log('');
console.log('Done');
console.log(`Database name: ${d1DatabaseName}`);
console.log(`Database id:   ${databaseId}`);
console.log(`Binding:       ${d1BindingName}`);
