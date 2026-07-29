#!/usr/bin/env bash
set -euo pipefail

# Creates or reuses the backend D1 database, updates wrangler.jsonc, and applies migrations.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
ENV_FILE="${1:-${BOOTSTRAP_ENV_FILE:-${SCRIPT_DIR}/.env}}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing .env file: ${ENV_FILE}" >&2
  echo "Provide one as the first argument or set BOOTSTRAP_ENV_FILE." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

require_var() {
  local key="$1"
  if [[ -z "${!key:-}" ]]; then
    echo "Missing required value in ${ENV_FILE}: ${key}" >&2
    exit 1
  fi
}

require_var CF_API_TOKEN
require_var CF_ACCOUNT_ID

D1_DATABASE_NAME="${D1_DATABASE_NAME:-demo-db}"
D1_BINDING_NAME="${D1_BINDING_NAME:-UPLOADS_DB}"
BACKEND_DIR="${BACKEND_DIR:-${ROOT_DIR}/modules/backend}"
BACKEND_WRANGLER_CONFIG="${BACKEND_WRANGLER_CONFIG:-${BACKEND_DIR}/wrangler.jsonc}"

extract_uuid() {
  grep -Eo '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}' | head -n 1 || true
}

update_wrangler_config() {
  local database_id="$1"

  BACKEND_WRANGLER_CONFIG="$BACKEND_WRANGLER_CONFIG" D1_DATABASE_NAME="$D1_DATABASE_NAME" DATABASE_ID="$database_id" node <<'NODE'
const fs = require('node:fs');

const configPath = process.env.BACKEND_WRANGLER_CONFIG;
const databaseName = process.env.D1_DATABASE_NAME;
const databaseId = process.env.DATABASE_ID;

let text = fs.readFileSync(configPath, 'utf8');
const namePattern = /("database_name"\s*:\s*")[^"]*(")/;
const idPattern = /("database_id"\s*:\s*")[^"]*(")/;

if (!namePattern.test(text)) {
  throw new Error(`Could not find database_name in ${configPath}`);
}

if (!idPattern.test(text)) {
  throw new Error(`Could not find database_id in ${configPath}`);
}

text = text.replace(namePattern, `$1${databaseName}$2`);
text = text.replace(idPattern, `$1${databaseId}$2`);
fs.writeFileSync(configPath, text);
NODE
}

cd "$BACKEND_DIR"

DATABASE_INFO_OUTPUT=""
if DATABASE_INFO_OUTPUT="$(pnpm exec wrangler d1 info "$D1_DATABASE_NAME" 2>/dev/null)"; then
  DATABASE_ID="$(printf '%s\n' "$DATABASE_INFO_OUTPUT" | extract_uuid)"
  echo "Found existing D1 database: ${D1_DATABASE_NAME}"
else
  echo "Creating D1 database: ${D1_DATABASE_NAME}"
  CREATE_OUTPUT="$(pnpm exec wrangler d1 create "$D1_DATABASE_NAME" --binding "$D1_BINDING_NAME" --update-config)"
  DATABASE_ID="$(printf '%s\n' "$CREATE_OUTPUT" | extract_uuid)"
fi

if [[ -z "$DATABASE_ID" ]]; then
  echo "Failed to resolve D1 database id for ${D1_DATABASE_NAME}" >&2
  exit 1
fi

echo "Updating backend wrangler config: ${BACKEND_WRANGLER_CONFIG}"
update_wrangler_config "$DATABASE_ID"

echo "Applying remote migrations for ${D1_DATABASE_NAME}"
pnpm exec wrangler d1 migrations apply "$D1_DATABASE_NAME" --remote

echo
echo "Done"
echo "Database name: ${D1_DATABASE_NAME}"
echo "Database id: ${DATABASE_ID}"
echo "Binding: ${D1_BINDING_NAME}"