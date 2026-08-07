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

export interface WorkflowBindingEntry {
  name: string;
  binding: string;
  class_name: string;
  script_name?: string;
}

/**
 * Idempotently insert or update a workflows binding entry in a wrangler JSONC
 * config. Uses string injection rather than JSON.parse to preserve comments.
 */
export function addWranglerWorkflowBinding(configPath: string, entry: WorkflowBindingEntry): void {
  let text = readFileSync(configPath, 'utf8');

  // Build the binding object (with optional script_name)
  const scriptLine = entry.script_name ? `\n      "script_name": "${entry.script_name}",` : '';
  const block = `  "workflows": [\n    {\n      "name": "${entry.name}",\n      "binding": "${entry.binding}",\n      "class_name": "${entry.class_name}"${scriptLine}\n    }\n  ],`;

  const existingPattern = /"workflows"\s*:\s*\[[\s\S]*?\]/;
  if (existingPattern.test(text)) {
    // Already present — update the entry matching by name
    text = text.replace(existingPattern, block.trimEnd().replace(/,$/, ''));
  } else {
    // Inject before the closing brace of the root object
    text = text.replace(/(\s*}\s*)$/, `\n${block}\n$1`);
  }

  writeFileSync(configPath, text);
}
