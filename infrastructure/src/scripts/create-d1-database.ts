import path from 'node:path';

import { loadScriptEnv, requireEnv } from '../lib/env.ts';
import { runCommand, runCommandOutput } from '../lib/run.ts';
import { updateWranglerFields } from '../lib/wrangler.ts';

const { env, rootDir } = loadScriptEnv('BOOTSTRAP_ENV_FILE');

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
updateWranglerFields(wranglerConfig, { database_name: d1DatabaseName, database_id: databaseId });

console.log(`Applying remote migrations for ${d1DatabaseName}`);
runCommand('pnpm', ['exec', 'wrangler', 'd1', 'migrations', 'apply', d1DatabaseName, '--remote'], {
  cwd: backendDir
});

console.log('');
console.log('Done');
console.log(`Database name: ${d1DatabaseName}`);
console.log(`Database id:   ${databaseId}`);
console.log(`Binding:       ${d1BindingName}`);
