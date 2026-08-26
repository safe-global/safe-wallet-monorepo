# Playwright E2E Guidelines

All new web E2E tests are written here. (Cypress in `../cypress/` is legacy — maintenance only, see [../cypress/AGENTS.md](../cypress/AGENTS.md).)

**Before writing any test, follow the 12-step AI Test Output Format in [docs/AI_TEST_OUTPUT_FORMAT.md](docs/AI_TEST_OUTPUT_FORMAT.md) — code is step 11 of 12.** Full conventions: [docs/README.md](docs/README.md). Migrating a Cypress spec: [docs/CYPRESS_MIGRATION_GUIDE.md](docs/CYPRESS_MIGRATION_GUIDE.md).

## Layout

- `tests/{smoke,regression,api,e2e}/` — specs
- `src/pages/` — page objects · `src/fixtures/` — fixtures · `src/data/` — test data · `src/api/` — API helpers

## Commands

The `pw:*` scripts live in the web workspace — run as `yarn workspace @safe-global/web <script>`: `pw:test` (all), `pw:test:smoke` (`@smoke` tag), `pw:test:api` (`@api` tag), `pw:test:ui` (`@ui` tag), `pw:report` (HTML report), `pw:ci` (CI mode — smoke with retries).
