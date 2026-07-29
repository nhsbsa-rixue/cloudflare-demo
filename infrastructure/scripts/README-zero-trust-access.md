Infrastructure bootstrap scripts

Location
- infrastructure/scripts/setup-zero-trust-access.sh
- infrastructure/scripts/verify-zero-trust-access.sh
- infrastructure/scripts/001-set-x-api-key-secret.sh
- infrastructure/scripts/002-create-d1-database.sh
- infrastructure/scripts/003-create-r2-bucket.sh

Purpose
- setup-zero-trust-access.sh:
  Creates or updates a Cloudflare Access self-hosted app and an Allow policy for invited emails.
- verify-zero-trust-access.sh:
  Prints app and policy summary for the configured domain.
- 001-set-x-api-key-secret.sh:
  Creates or updates the shared `x-api-key` secret for the frontend Pages project and backend Worker.
- 002-create-d1-database.sh:
  Creates or reuses the backend D1 database, updates `modules/backend/wrangler.jsonc`, and applies migrations.
- 003-create-r2-bucket.sh:
  Creates or reuses the backend R2 bucket and keeps the backend Wrangler config in sync.

Required values in .env
- CF_API_TOKEN
- CF_ACCOUNT_ID
- ACCESS_APP_DOMAIN
- X_API_KEY

Additional required value for setup script
- ACCESS_ALLOW_EMAILS

Optional setup values
- APP_ID (optional existing Access app id)
- ACCESS_APP_NAME (default: cloudflare-demo-web-access)
- ACCESS_POLICY_NAME (default: allow-invited-users)
- ACCESS_SESSION_DURATION (default: 24h)
- ACCESS_AUTO_REDIRECT (default: false)
- FRONTEND_PROJECT_NAME (default: cloudflare-demo-web)
- BACKEND_WORKER_NAME (default: cloudflare-demo-worker)
- API_KEY_SECRET_NAME (default: x-api-key)
- D1_DATABASE_NAME (default: demo-db)
- D1_BINDING_NAME (default: UPLOADS_DB)
- R2_BUCKET_NAME (default: files)
- BACKEND_DIR (default: modules/backend)
- BACKEND_WRANGLER_CONFIG (default: modules/backend/wrangler.jsonc)

Example
1) Create infrastructure/scripts/.env
- CF_API_TOKEN="your-token"
- CF_ACCOUNT_ID="your-account-id"
- ACCESS_APP_DOMAIN="cloudflare-demo-web-2aq.pages.dev"
- ACCESS_ALLOW_EMAILS="you@example.com,operator@example.com"
- X_API_KEY="your-shared-secret"

2) Provision the shared API key secret
- ./infrastructure/scripts/001-set-x-api-key-secret.sh

3) Create or update the D1 database and apply migrations
- ./infrastructure/scripts/002-create-d1-database.sh

4) Create or update the R2 bucket
- ./infrastructure/scripts/003-create-r2-bucket.sh

5) Create or update Zero Trust Access
- ./infrastructure/scripts/setup-zero-trust-access.sh


6) Verify Access app and policies
- ./infrastructure/scripts/verify-zero-trust-access.sh

7) Run the full bootstrap in order
- pnpm run bootstrap

Optional: pass a custom .env path to either script
- ./infrastructure/scripts/setup-zero-trust-access.sh ./path/to/.env
- ./infrastructure/scripts/verify-zero-trust-access.sh ./path/to/.env
- ./infrastructure/scripts/001-set-x-api-key-secret.sh ./path/to/.env
- ./infrastructure/scripts/002-create-d1-database.sh ./path/to/.env
- ./infrastructure/scripts/003-create-r2-bucket.sh ./path/to/.env

Notes
- The app now reads the shared secret from `x-api-key` and still accepts `UPLOAD_API_KEY` as a fallback during transition.
- Run in the same Cloudflare account that owns the Pages app, Worker, D1 database, and R2 bucket.
- The D1 script updates `modules/backend/wrangler.jsonc` with the created or discovered database id before applying migrations.
- Test the Access challenge in an incognito window at `/upload` after setup.
