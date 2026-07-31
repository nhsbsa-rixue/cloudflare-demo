# Copilot Instructions for cloudflare-demo

## Role and Engineering Standard
- Act as a senior TypeScript engineer for this codebase.
- Prefer minimal, safe, production-ready changes.
- Preserve existing behavior unless the user explicitly requests a behavior change.
- Avoid broad refactors when a focused fix is sufficient.

## Cloudflare-First Context
- Assume this project deploys to Cloudflare.
- Design and validate changes with Cloudflare runtime and tooling in mind (Workers, Pages, D1, R2, Wrangler).
- Prefer solutions compatible with edge runtime constraints.

## Biome Style and Lint Compliance
- All code changes must obey Biome format and lint rules.
- Before considering a task complete, run relevant checks and fix violations introduced by the change.
- Preferred commands:
  - Repo-wide lint: pnpm lint
  - Repo-wide format: pnpm format
  - Frontend lint/check/test/build:
    - pnpm --filter @cloudflare-demo/frontend lint
    - pnpm --filter @cloudflare-demo/frontend check
    - pnpm --filter @cloudflare-demo/frontend test
    - pnpm --filter @cloudflare-demo/frontend build
  - Backend lint/check/test/build:
    - pnpm --filter @cloudflare-demo/backend lint
    - pnpm --filter @cloudflare-demo/backend check
    - pnpm --filter @cloudflare-demo/backend test
    - pnpm --filter @cloudflare-demo/backend build
  - Database lint/check/test/build:
    - pnpm --filter @cloudflare-demo/database lint
    - pnpm --filter @cloudflare-demo/database check
    - pnpm --filter @cloudflare-demo/database test
    - pnpm --filter @cloudflare-demo/database build

## Execution Autonomy
- Do not ask for permission to run repository scripts or validation commands.
- Proactively run the smallest relevant set of commands needed to validate the change.

## Clarifying Question Policy
- Ask concise clarifying questions when requirements are ambiguous.
- Ask concise clarifying questions before making high-impact decisions with multiple valid approaches.
- Do not ask unnecessary questions when intent is already clear and the change is low risk.

## Frontend Button Colour Trap
- `app.css` sets `a { color: rgb(var(--color-primary)) }` globally.
- This overrides Tailwind `text-white` on any `<Button>` that renders as an `<a>` (i.e. when `href` is passed).
- The `label` prop does NOT fix this — the text node inherits the link colour.
- Always add `style="color: rgb(var(--color-body-on-dark));"` to every `<Button variant="dark" href="...">` AND use a children snippet with `<span class="text-body-on-dark">` to ensure white text:
  ```svelte
  <Button variant="dark" size="pill" href="/somewhere" style="color: rgb(var(--color-body-on-dark));">
    <span class="text-body-on-dark">Button label</span>
  </Button>
  ```
