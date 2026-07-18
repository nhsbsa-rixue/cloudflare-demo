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
  await run('pnpm', ['build']);

  const buildWatch = start('pnpm', ['build', '--watch']);
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

  await Promise.race([
    new Promise((resolve, reject) => {
      buildWatch.on('exit', (code, signal) => {
        if (code === 0) {
          resolve();
          return;
        }

        reject(new Error(`pnpm build --watch exited with ${signal ?? code}`));
      });

      buildWatch.on('error', reject);
    }),
    new Promise((resolve, reject) => {
      pagesDev.on('exit', (code, signal) => {
        if (code === 0) {
          resolve();
          return;
        }

        reject(new Error(`wrangler pages dev exited with ${signal ?? code}`));
      });

      pagesDev.on('error', reject);
    })
  ]).finally(stopChildren);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});