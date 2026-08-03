import { readFileSync, writeFileSync } from 'node:fs';

/**
 * Replace the string value of one or more `"key": "..."` entries in a wrangler
 * JSONC config. Validates every key is present before writing, then writes once.
 * Throws if any key is missing.
 */
export function updateWranglerFields(configPath: string, fields: Record<string, string>): void {
  let text = readFileSync(configPath, 'utf8');

  for (const [key, value] of Object.entries(fields)) {
    const pattern = new RegExp(String.raw`("${key}"\s*:\s*")[^"]*(")`);
    if (!pattern.test(text)) {
      throw new Error(`Could not find ${key} in ${configPath}`);
    }
    text = text.replace(pattern, `$1${value}$2`);
  }

  writeFileSync(configPath, text);
}
