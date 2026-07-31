#!/usr/bin/env bash
set -euo pipefail

# Creates or updates a Cloudflare Zero Trust Access app and Allow policy for invited users.
#
# Required values in .env:
# - CF_API_TOKEN
# - CF_ACCOUNT_ID
# - ACCESS_APP_DOMAIN          (example: cloudflare-demo-web-2aq.pages.dev)
# - ACCESS_ALLOW_EMAILS        (comma-separated emails)
#
# Optional values in .env:
# - APP_ID                     (optional existing Access app id)
# - ACCESS_APP_NAME            (default: cloudflare-demo-web-access)
# - ACCESS_POLICY_NAME         (default: allow-invited-users)
# - ACCESS_SESSION_DURATION    (default: 24h)
# - ACCESS_AUTO_REDIRECT       (default: false)

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

require_var ACCESS_APP_NAME
require_var CF_API_TOKEN
require_var CF_ACCOUNT_ID
require_var ACCESS_APP_DOMAIN

ACCESS_APP_NAME="${ACCESS_APP_NAME:-cloudflare-demo-web-access}"
ACCESS_POLICY_NAME="${ACCESS_POLICY_NAME:-allow-invited-users}"
ACCESS_SESSION_DURATION="${ACCESS_SESSION_DURATION:-24h}"
ACCESS_AUTO_REDIRECT="${ACCESS_AUTO_REDIRECT:-false}"
APP_ID="${APP_ID:-}"

# Node payload builders read process.env, so export resolved defaults.
export ACCESS_APP_NAME ACCESS_POLICY_NAME ACCESS_SESSION_DURATION ACCESS_AUTO_REDIRECT

BASE_URL="https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/access"

api() {
  local method="$1"
  local path="$2"
  local body="${3:-}"

  if [[ -n "$body" ]]; then
    curl -fsS -X "$method" "${BASE_URL}${path}" \
      -H "Authorization: Bearer ${CF_API_TOKEN}" \
      -H "Content-Type: application/json" \
      --data "$body"
  else
    curl -fsS -X "$method" "${BASE_URL}${path}" \
      -H "Authorization: Bearer ${CF_API_TOKEN}" \
      -H "Content-Type: application/json"
  fi
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

build_app_payload() {
  node -e "
const payload = {
  name: process.env.ACCESS_APP_NAME,
  type: 'self_hosted',
  domain: process.env.ACCESS_APP_DOMAIN,
  session_duration: process.env.ACCESS_SESSION_DURATION,
  auto_redirect_to_identity: process.env.ACCESS_AUTO_REDIRECT === 'true'
};
process.stdout.write(JSON.stringify(payload));
"
}

echo "Checking existing Access app for domain: ${ACCESS_APP_DOMAIN}"
if [[ -n "$APP_ID" ]]; then
  echo "Using APP_ID from .env: ${APP_ID}"
  api GET "/apps/${APP_ID}" > /dev/null
else
  APPS_JSON="$(api GET "/apps")"
  APP_ID="$(printf '%s' "$APPS_JSON" | json_read "
const app = (data.result || []).find((a) => a.domain === process.env.ACCESS_APP_DOMAIN);
process.stdout.write(app?.id || '');
")"
fi

APP_BODY="$(build_app_payload)"

if [[ -z "$APP_ID" ]]; then
  echo "Creating new Access app: ${ACCESS_APP_NAME}"
  CREATE_APP_JSON="$(api POST "/apps" "$APP_BODY")"
  APP_ID="$(printf '%s' "$CREATE_APP_JSON" | json_read "process.stdout.write(data.result?.id || '');")"

  if [[ -z "$APP_ID" ]]; then
    echo "Failed to create Access app." >&2
    exit 1
  fi
else
  echo "Access app already exists. Updating app settings for: ${APP_ID}"
  api PUT "/apps/${APP_ID}" "$APP_BODY" > /dev/null
fi

echo "Resolving policy by name: ${ACCESS_POLICY_NAME}"
POLICIES_JSON="$(api GET "/apps/${APP_ID}/policies")"
POLICY_ID="$(printf '%s' "$POLICIES_JSON" | json_read "
const policy = (data.result || []).find((p) => p.name === process.env.ACCESS_POLICY_NAME);
process.stdout.write(policy?.id || '');
")"

if [[ -z "$POLICY_ID" ]]; then
  POLICY_COUNT="$(printf '%s' "$POLICIES_JSON" | json_read "
const policies = data.result || [];
process.stdout.write(String(policies.length));
")"
  if [[ "$POLICY_COUNT" == "1" ]]; then
    POLICY_ID="$(printf '%s' "$POLICIES_JSON" | json_read "
const policy = (data.result || [])[0];
process.stdout.write(policy?.id || '');
")"
    if [[ -n "$POLICY_ID" ]]; then
      echo "No policy name match found; updating existing single policy: ${POLICY_ID}"
    fi
  fi
fi

# Allow any OTP-verified email through Access; the D1 users table is the sole whitelist.
POLICY_BODY="$(node -e "
const payload = {
  name: process.env.ACCESS_POLICY_NAME,
  decision: 'allow',
  precedence: 1,
  include: [{ everyone: {} }],
  exclude: [],
  require: []
};
process.stdout.write(JSON.stringify(payload));
")"

if [[ -z "$POLICY_ID" ]]; then
  echo "Creating new policy"
  api POST "/apps/${APP_ID}/policies" "$POLICY_BODY" > /dev/null
else
  echo "Updating existing policy: ${POLICY_ID}"
  api PUT "/apps/${APP_ID}/policies/${POLICY_ID}" "$POLICY_BODY" > /dev/null
fi

echo
echo "Done"
echo "App ID: ${APP_ID}"
echo "Domain: ${ACCESS_APP_DOMAIN}"
echo "Policy: ${ACCESS_POLICY_NAME}"
echo "Policy: allow everyone (D1 whitelist enforced at app layer)"
