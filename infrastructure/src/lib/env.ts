import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

export type EnvMap = Record<string, string>;

export function loadEnvFile(filePath: string): EnvMap {
  const contents = readFileSync(filePath, 'utf8');
  const env: EnvMap = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const equalsIndex = line.indexOf('=');
    if (equalsIndex < 0) {
      continue;
    }

    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

export function requireEnv(env: EnvMap, key: string): string {
  const value = env[key] ?? '';
  if (!value) {
    throw new Error(`Missing required value: ${key}`);
  }

  return value;
}

/**
 * Resolve and load the script's .env file, then mirror every value into
 * `process.env`. The env file is taken from argv[2], then the given override
 * variable (e.g. BOOTSTRAP_ENV_FILE / ACCESS_ENV_FILE), then infrastructure/.env.
 */
export function loadScriptEnv(overrideEnvVar: string): { env: EnvMap; rootDir: string } {
  const packageDir = process.cwd();
  const rootDir = path.resolve(packageDir, '..');
  const envFile = process.argv[2] ?? process.env[overrideEnvVar] ?? path.join(rootDir, 'infrastructure/.env');

  if (!existsSync(envFile)) {
    throw new Error(`Missing .env file: ${envFile}`);
  }

  const env = loadEnvFile(envFile);

  for (const [key, value] of Object.entries(env)) {
    process.env[key] = value;
  }

  return { env, rootDir };
}
