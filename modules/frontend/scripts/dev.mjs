import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';

const cwd = fileURLToPath(new URL('..', import.meta.url));
const isWin = process.platform === 'win32';

function resolveBin(name) {
  return isWin ? `${name}.cmd` : name;
}

function start(command, args) {
  return spawn(resolveBin(command), args, {
    cwd,
    shell: false,
    stdio: 'inherit',
    detached: !isWin
  });
}

function killProcessTree(child, signal = 'SIGTERM') {
  if (!child || child.exitCode !== null || child.killed) {
    return;
  }

  if (isWin) {
    child.kill(signal);
    return;
  }

  try {
    process.kill(-child.pid, signal);
  } catch {
    child.kill(signal);
  }
}

async function run(command, args) {
  const child = start(command, args);
  const [code, signal] = await once(child, 'exit');

  if (code !== 0) {
    throw new Error(`${command} ${args.join(' ')} exited with ${signal ?? code}`);
  }
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
  let stopping = false;
  let userInitiatedStop = false;

  const stopChildren = (signal = 'SIGTERM') => {
    if (stopping) {
      return;
    }

    stopping = true;

    for (const child of children) {
      killProcessTree(child, signal);
    }

    setTimeout(() => {
      for (const child of children) {
        killProcessTree(child, 'SIGKILL');
      }
    }, 2500).unref();
  };

  process.once('SIGINT', () => {
    userInitiatedStop = true;
    stopChildren('SIGINT');
  });

  process.once('SIGTERM', () => {
    userInitiatedStop = true;
    stopChildren('SIGTERM');
  });

  const firstExit = await Promise.race([
    once(buildWatch, 'exit').then(([code, signal]) => ({
      name: 'buildWatch',
      code,
      signal
    })),
    once(pagesDev, 'exit').then(([code, signal]) => ({
      name: 'pagesDev',
      code,
      signal
    }))
  ]);

  stopChildren('SIGTERM');
  await Promise.allSettled(children.map((child) => once(child, 'exit')));

  if (userInitiatedStop) {
    return;
  }

  if (firstExit.signal === 'SIGINT' || firstExit.signal === 'SIGTERM') {
    return;
  }

  if (firstExit.name === 'pagesDev' && firstExit.code === 0) {
    return;
  }

  throw new Error(
    firstExit.name === 'buildWatch'
      ? `pnpm run build --watch exited with ${firstExit.signal ?? firstExit.code}`
      : `wrangler pages dev exited with ${firstExit.signal ?? firstExit.code}`
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});