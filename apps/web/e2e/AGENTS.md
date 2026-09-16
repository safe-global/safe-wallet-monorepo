# Playwright E2E Guidelines

All new web E2E tests are written here. (Cypress in `../cypress/` is legacy — maintenance only, see [../cypress/AGENTS.md](../cypress/AGENTS.md).)

**Before writing any test, follow the 12-step AI Test Output Format in [docs/AI_TEST_OUTPUT_FORMAT.md](docs/AI_TEST_OUTPUT_FORMAT.md) — code is step 11 of 12.** Full conventions: [docs/README.md](docs/README.md).

Cypress → Playwright migration: follow [docs/CYPRESS_MIGRATION_GUIDE.md](docs/CYPRESS_MIGRATION_GUIDE.md) — it defines the mandatory per-test classification **and** the staged programme (one stage per PR, easiest area first). Pick up work from the live queue in [docs/CYPRESS_PW_MIGRATION_STATUS.md](docs/CYPRESS_PW_MIGRATION_STATUS.md) and update it in the same PR.

## Layout

- `tests/{smoke,regression,api,e2e}/` — specs
- `src/pages/` — page objects · `src/fixtures/` — fixtures · `src/data/` — test data · `src/api/` — API helpers

## Commands

The `pw:*` scripts live in the web workspace — run as `yarn workspace @safe-global/web <script>`: `pw:test` (all), `pw:test:smoke` / `pw:test:api` / `pw:test:ui` / `pw:test:regression` (by tag), `pw:report` (HTML report), `pw:ci` (CI mode — `@smoke|@api` with retries).

CI: smoke + api run on **every PR** touching `apps/web/**` or `packages/**` (`web-pw-smoke.yml`); the full suite runs on demand and on a weekday cron (`web-pw-full-ondemand.yml`).
