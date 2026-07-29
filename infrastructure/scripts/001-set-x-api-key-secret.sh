#!/usr/bin/env bash
set -euo pipefail

# Creates or updates the shared x-api-key secret for the frontend Pages project and backend Worker.

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
require_var X_API_KEY

FRONTEND_PROJECT_NAME="${FRONTEND_PROJECT_NAME:-cloudflare-demo-web}"
BACKEND_WORKER_NAME="${BACKEND_WORKER_NAME:-cloudflare-demo-worker}"
API_KEY_SECRET_NAME="${API_KEY_SECRET_NAME:-x-api-key}"

cd "$ROOT_DIR"

echo "Updating Pages secret ${API_KEY_SECRET_NAME} for project ${FRONTEND_PROJECT_NAME}"
printf '%s\n' "$X_API_KEY" | pnpm --filter @cloudflare-demo/frontend exec wrangler pages secret put "$API_KEY_SECRET_NAME" --project-name "$FRONTEND_PROJECT_NAME"

echo "Updating Worker secret ${API_KEY_SECRET_NAME} for worker ${BACKEND_WORKER_NAME}"
printf '%s\n' "$X_API_KEY" | pnpm --filter @cloudflare-demo/backend exec wrangler secret put "$API_KEY_SECRET_NAME" --name "$BACKEND_WORKER_NAME"

echo
echo "Done"
echo "Secret name: ${API_KEY_SECRET_NAME}"
echo "Pages project: ${FRONTEND_PROJECT_NAME}"
echo "Worker: ${BACKEND_WORKER_NAME}"