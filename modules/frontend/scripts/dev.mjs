import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const cwd = fileURLToPath(new URL('..', import.meta.url));

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      shell: true,
      stdio: 'inherit',
      ...options
    });

    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(' ')} exited with ${signal ?? code}`));
    });
  });
}

function start(command, args) {
  return spawn(command, args, {
    cwd,
    shell: true,
    stdio: 'inherit'
  });
}

async function main() {
  await run('pnpm', ['run', 'build']);

  // Keep rebuilding on file changes (including src/app.html) while pages dev is running.
  const buildWatch = start('pnpm', ['run', 'build', '--watch']);

  const pagesDev = start('wrangler', [
    'pages',
    'dev',
    '.svelte-kit/cloudflare',
    '--service',
    'WORKER=cloudflare-demo-worker'
  ]);

  const children = [buildWatch, pagesDev];

  const stopChildren = () => {
    for (const child of children) {
      if (!child.killed) {
        child.kill('SIGINT');
      }
    }
  };

  process.once('SIGINT', stopChildren);
  process.once('SIGTERM', stopChildren);

  await new Promise((resolve, reject) => {
    buildWatch.on('exit', (code, signal) => {
      // If the watcher exits on its own, the dev environment is no longer valid.
      if (signal === 'SIGINT' || signal === 'SIGTERM') {
        resolve();
        return;
      }

      reject(new Error(`pnpm run build --watch exited with ${signal ?? code}`));
    });

    buildWatch.on('error', reject);

    pagesDev.on('exit', (code, signal) => {
      if (code === 0 || signal === 'SIGINT' || signal === 'SIGTERM') {
        resolve();
        return;
      }

      reject(new Error(`wrangler pages dev exited with ${signal ?? code}`));
    });

    pagesDev.on('error', reject);
  }).finally(stopChildren);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});