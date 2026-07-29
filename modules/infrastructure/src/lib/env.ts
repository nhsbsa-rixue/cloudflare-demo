import { readFileSync } from 'node:fs';

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
