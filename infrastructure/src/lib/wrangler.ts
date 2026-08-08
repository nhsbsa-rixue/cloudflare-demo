import { readFileSync, writeFileSync } from 'node:fs';

/**
 * Replace the string value of one or more `key = "..."` entries in a wrangler
 * TOML config. Validates every key is present before writing, then writes once.
 * Throws if any key is missing.
 */
export function updateWranglerFields(configPath: string, fields: Record<string, string>): void {
  let text = readFileSync(configPath, 'utf8');

  for (const [key, value] of Object.entries(fields)) {
    const pattern = new RegExp(String.raw`(${key}\s*=\s*")[^"]*(")`);
    if (!pattern.test(text)) {
      throw new Error(`Could not find ${key} in ${configPath}`);
    }
    text = text.replace(pattern, `$1${value}$2`);
  }

  writeFileSync(configPath, text);
}

export interface WorkflowBindingEntry {
  name: string;
  binding: string;
  class_name: string;
  script_name?: string;
}

/**
 * Idempotently insert or update a [[workflows]] binding entry in a wrangler TOML
 * config.
 */
export function addWranglerWorkflowBinding(configPath: string, entry: WorkflowBindingEntry): void {
  let text = readFileSync(configPath, 'utf8');

  const scriptLine = entry.script_name ? `\nscript_name = "${entry.script_name}"` : '';
  const block = `[[workflows]]\nname = "${entry.name}"\nbinding = "${entry.binding}"\nclass_name = "${entry.class_name}"${scriptLine}\n`;

  // Match an existing [[workflows]] section: header + all key = "..." lines
  const existingPattern = /\[\[workflows\]\]\n(?:[a-z_]+ = "[^"]*"\n)*/;
  if (existingPattern.test(text)) {
    text = text.replace(existingPattern, block);
  } else {
    text = text.trimEnd() + '\n\n' + block;
  }

  writeFileSync(configPath, text);
}
