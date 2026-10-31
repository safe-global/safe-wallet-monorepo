# Playwright E2E Guidelines

All new web E2E tests are written here. (Cypress in `../cypress/` is legacy — maintenance only, see [../cypress/AGENTS.md](../cypress/AGENTS.md).)

**Before writing any test, follow the 12-step AI Test Output Format in [docs/AI_TEST_OUTPUT_FORMAT.md](docs/AI_TEST_OUTPUT_FORMAT.md) — code is step 11 of 12.** Full conventions: [docs/README.md](docs/README.md).

Cypress → Playwright migration: move each Cypress test to the lowest level that covers it (unit or component test first, a Playwright journey only for a user flow), and delete what nothing needs. The specs still in `../cypress/e2e/` are the remaining work. In the PR description, list each migrated or deleted Cypress test with its replacement or the reason it goes.

## Layout

- `tests/{smoke,regression,api,e2e}/` — specs; they run on staging and, when registered in `environment/playwright-specs.mjs`, on the local stack. Read Safes and wallets from the `safes` and `credentials` fixtures, never from `SAFES` directly
- `src/pages/` — page objects · `src/fixtures/` — fixtures · `src/data/` — test data · `src/api/` — API helpers · `src/seed/` and `src/chain/` — seed state and on-chain reads for the journeys in `tests/e2e/`

## Commands

The `pw:*` scripts live in the web workspace — run as `yarn workspace @safe-global/web <script>`: `pw:test` (all), `pw:test:smoke` / `pw:test:api` / `pw:test:ui` / `pw:test:regression` (by tag), `pw:report` (HTML report), `pw:ci` (CI mode — `@smoke|@api` with retries).

CI: smoke + api run on **every PR** touching `apps/web/**` or `packages/**` (`web-pw-smoke.yml`); the full suite runs on demand and on a weekday cron (`web-pw-full-ondemand.yml`).

## Isolated backend and Cypress regression

`environment/run.mjs` launches the checked-in Anvil backend, the registered Cypress regression specs (`e2e:env cypress`) and the registered Playwright specs (`e2e:env playwright`), with data from the scenarios in `environment/scenarios/`. Run helper tests with `yarn workspace @safe-global/web e2e:env:test`: Node's test runner runs `environment/*.test.mjs`, `src/**/*.test.mjs` (unit tests of the Playwright helpers, such as `src/data/credentials.test.mjs`) and the mock tests. Preserve the fork hash, TXS indexing floor and CGW-visible scenario preconditions. Provider credentials must never reach the wallet, Cypress or Playwright processes.

`web-isolated-e2e-backend.yml` builds the wallet before backend startup and runs the Playwright specs in shards, each on its own backend, on the same ARM runner type. Pull requests and pushes to `dev` run against the service versions on staging, and release pull requests against production, so a red run can come from a backend deploy, not from the pull request; the run summary lists the images. Require the `Isolated E2E result` job, not a shard, in branch protection. The backend action leaves containers running; the workflow must always attempt cleanup after tests. Native dependency and build caches include runner architecture. Chromium comes from the installed Playwright version. See [local setup](docs/ISOLATED_ENVIRONMENT.md) and [backend guidance](environment/infra/AGENTS.md).
