#!/usr/bin/env bash
set -euo pipefail

# Creates or reuses the backend R2 bucket and keeps wrangler.jsonc in sync.

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

R2_BUCKET_NAME="${R2_BUCKET_NAME:-files}"
BACKEND_DIR="${BACKEND_DIR:-${ROOT_DIR}/modules/backend}"
BACKEND_WRANGLER_CONFIG="${BACKEND_WRANGLER_CONFIG:-${BACKEND_DIR}/wrangler.jsonc}"

update_wrangler_config() {
  local bucket_name="$1"

  BACKEND_WRANGLER_CONFIG="$BACKEND_WRANGLER_CONFIG" BUCKET_NAME="$bucket_name" node <<'NODE'
const fs = require('node:fs');

const configPath = process.env.BACKEND_WRANGLER_CONFIG;
const bucketName = process.env.BUCKET_NAME;

let text = fs.readFileSync(configPath, 'utf8');
const bucketPattern = /("bucket_name"\s*:\s*")[^"]*(")/;

if (!bucketPattern.test(text)) {
  throw new Error(`Could not find bucket_name in ${configPath}`);
}

text = text.replace(bucketPattern, `$1${bucketName}$2`);
fs.writeFileSync(configPath, text);
NODE
}

cd "$BACKEND_DIR"

if pnpm exec wrangler r2 bucket info "$R2_BUCKET_NAME" >/dev/null 2>&1; then
  echo "Found existing R2 bucket: ${R2_BUCKET_NAME}"
else
  echo "Creating R2 bucket: ${R2_BUCKET_NAME}"
  pnpm exec wrangler r2 bucket create "$R2_BUCKET_NAME"
fi

echo "Updating backend wrangler config: ${BACKEND_WRANGLER_CONFIG}"
update_wrangler_config "$R2_BUCKET_NAME"

echo
echo "Done"
echo "Bucket name: ${R2_BUCKET_NAME}"