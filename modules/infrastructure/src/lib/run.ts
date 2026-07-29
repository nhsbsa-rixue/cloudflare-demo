import { spawnSync } from 'node:child_process';

export function runCommand(command: string, args: string[], options: { cwd: string; input?: string }): void {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    input: options.input,
    stdio: ['pipe', 'inherit', 'inherit'],
    encoding: 'utf8'
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} exited with code ${String(result.status ?? 'unknown')}`);
  }
}
