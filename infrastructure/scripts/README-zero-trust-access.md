Zero Trust Access API scripts

Location
- infrastructure/scripts/setup-zero-trust-access.sh
- infrastructure/scripts/verify-zero-trust-access.sh

Purpose
- setup-zero-trust-access.sh:
  Creates or updates a Cloudflare Access self-hosted app and an Allow policy for invited emails.
- verify-zero-trust-access.sh:
  Prints app and policy summary for the configured domain.

Required values in .env
- CF_API_TOKEN
- CF_ACCOUNT_ID
- ACCESS_APP_DOMAIN

Additional required value for setup script
- ACCESS_ALLOW_EMAILS

Optional setup values
- APP_ID (optional existing Access app id)
- ACCESS_APP_NAME (default: cloudflare-demo-web-access)
- ACCESS_POLICY_NAME (default: allow-invited-users)
- ACCESS_SESSION_DURATION (default: 24h)
- ACCESS_AUTO_REDIRECT (default: false)

Example
1) Create infrastructure/scripts/.env
- CF_API_TOKEN="your-token"
- CF_ACCOUNT_ID="your-account-id"
- ACCESS_APP_DOMAIN="cloudflare-demo-web-2aq.pages.dev"
- ACCESS_ALLOW_EMAILS="you@example.com,operator@example.com"

2) Create or update app and policy
- ./infrastructure/scripts/setup-zero-trust-access.sh

3) Verify app and policies
- ./infrastructure/scripts/verify-zero-trust-access.sh

Optional: pass a custom .env path to either script
- ./infrastructure/scripts/setup-zero-trust-access.sh ./path/to/.env
- ./infrastructure/scripts/verify-zero-trust-access.sh ./path/to/.env

Notes
- Run in the same Cloudflare account that owns the Pages app.
- Test challenge in an incognito window at /upload after setup.
