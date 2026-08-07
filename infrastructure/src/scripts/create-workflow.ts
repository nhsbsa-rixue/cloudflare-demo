import path from 'node:path';

import { loadScriptEnv, requireEnv } from '../lib/env.ts';
import { runCommandOutput } from '../lib/run.ts';
import { addWranglerWorkflowBinding } from '../lib/wrangler.ts';

const { env, rootDir } = loadScriptEnv('BOOTSTRAP_ENV_FILE');

requireEnv(env, 'CLOUDFLARE_API_TOKEN');
requireEnv(env, 'CF_ACCOUNT_ID');

const workflowName = env.WORKFLOW_NAME ?? 'analyse-workflow';
const workflowBinding = env.WORKFLOW_BINDING ?? 'ANALYSE_WORKFLOW';
const workflowClass = env.WORKFLOW_CLASS ?? 'AnalyseWorkflow';
const workflowDir = env.WORKFLOW_DIR ?? path.join(rootDir, 'modules/analyse-workflow');
const backendDir = env.BACKEND_DIR ?? path.join(rootDir, 'modules/backend');
const wranglerConfig = env.BACKEND_WRANGLER_CONFIG ?? path.join(backendDir, 'wrangler.jsonc');

// Verify uv is installed — required to manage Python deps and deploy with pywrangler
runCommandOutput('uv', ['--version'], { cwd: rootDir });
console.log('uv is available');

console.log(`Installing Python dependencies in ${workflowDir}`);
runCommandOutput('uv', ['sync'], { cwd: workflowDir });

console.log(`Updating backend wrangler config: ${wranglerConfig}`);
addWranglerWorkflowBinding(wranglerConfig, {
  name: workflowName,
  binding: workflowBinding,
  class_name: workflowClass,
  script_name: workflowName
});

console.log('');
console.log('Done');
console.log(`Workflow name:    ${workflowName}`);
console.log(`Binding:          ${workflowBinding}`);
console.log(`Class:            ${workflowClass}`);
console.log('');
console.log('Next step: deploy the Python Workflow Worker with:');
console.log('  pnpm --filter @cloudflare-demo/analyse-workflow deploy');
