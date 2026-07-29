#!/usr/bin/env bash
set -euo pipefail

# Prints the Access app and policy summary for a given domain.
#
# Required values in .env:
# - CF_API_TOKEN
# - CF_ACCOUNT_ID
# - ACCESS_APP_DOMAIN

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${1:-${ACCESS_ENV_FILE:-${SCRIPT_DIR}/.env}}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing .env file: ${ENV_FILE}" >&2
  echo "Provide one as the first argument or set ACCESS_ENV_FILE." >&2
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
require_var ACCESS_APP_DOMAIN

BASE_URL="https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/access"

api() {
  local method="$1"
  local path="$2"
  curl -fsS -X "$method" "${BASE_URL}${path}" \
    -H "Authorization: Bearer ${CF_API_TOKEN}" \
    -H "Content-Type: application/json"
}

json_read() {
  local expr="$1"
  node -e "
const fs = require('node:fs');
const input = fs.readFileSync(0, 'utf8');
const data = JSON.parse(input || '{}');
${expr}
"
}

APPS_JSON="$(api GET "/apps")"
APP_ID="$(printf '%s' "$APPS_JSON" | json_read "
const app = (data.result || []).find((a) => a.domain === process.env.ACCESS_APP_DOMAIN);
process.stdout.write(app?.id || '');
")"

if [[ -z "$APP_ID" ]]; then
  echo "No Access app found for domain: ${ACCESS_APP_DOMAIN}"
  exit 1
fi

APP_JSON="$(api GET "/apps/${APP_ID}")"
POLICIES_JSON="$(api GET "/apps/${APP_ID}/policies")"

echo "Access app summary"
printf '%s' "$APP_JSON" | json_read "
const app = data.result || {};
console.log('  ID: ' + (app.id || ''));
console.log('  Name: ' + (app.name || ''));
console.log('  Domain: ' + (app.domain || ''));
console.log('  Type: ' + (app.type || ''));
console.log('  Session duration: ' + (app.session_duration || ''));
"

echo
echo "Policies"
printf '%s' "$POLICIES_JSON" | json_read "
const policies = data.result || [];
if (policies.length === 0) {
  console.log('  No policies found');
  process.exit(0);
}
for (const p of policies) {
  const include = Array.isArray(p.include) ? p.include.length : 0;
  console.log('  - ID: ' + (p.id || ''));
  console.log('    Name: ' + (p.name || ''));
  console.log('    Decision: ' + (p.decision || ''));
  console.log('    Precedence: ' + String(p.precedence ?? ''));
  console.log('    Include rules: ' + include);
}
"
