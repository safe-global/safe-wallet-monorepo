# Playwright E2E Guidelines

All new web E2E tests are written here. A Playwright test is only for behaviour that needs a real browser or several real services together; everything else goes in Jest ([Choose the test level](../AGENTS.md#choose-the-test-level)). Write it by the [Clean tests](../../../docs/ai/testing-conventions.md#clean-tests) rules.

**Before writing any test, follow the 12-step AI Test Output Format in [docs/AI_TEST_OUTPUT_FORMAT.md](docs/AI_TEST_OUTPUT_FORMAT.md) — code is step 11 of 12.** How to write a journey, page objects, waits and debugging: [docs/README.md](docs/README.md).

Cypress → Playwright migration: move each Cypress test to the lowest level that covers it (unit or component test first, a Playwright journey only for a user flow), and delete what nothing needs. The specs still in `../cypress/e2e/` are the remaining work. In the PR description, list each migrated or deleted Cypress test with its replacement or the reason it goes.

## Layout

- `tests/e2e/` — journeys: each test seeds its own Safe with `seedSafe(journey, …)` from `src/seed/`, acts in the UI and checks the result in CGW and on chain (`src/chain/`)
- `tests/{regression,smoke}/` — specs that read the Safes their scenarios prepare, from the `safes` and `credentials` fixtures, never from `SAFES` directly
- Every spec is registered in `environment/playwright-specs.mjs` and runs on the isolated stack
- `src/pages/` — page objects · `src/fixtures/` — fixtures · `src/data/` — test data · `src/api/` — API helpers

## Commands

`yarn workspace @safe-global/web e2e:env playwright` runs the registered specs against the isolated stack; `SAFE_E2E_SPECS=<file name>` selects some. Setup: [docs/ISOLATED_ENVIRONMENT.md](docs/ISOLATED_ENVIRONMENT.md).

CI: every registered spec runs on **every PR** on the isolated stack (`web-isolated-e2e-backend.yml`, see below). No CI job runs Playwright against staging. `playwright.config.ts` and the `pw:*` scripts still run the specs against staging locally; they are being removed, so do not write a spec that needs staging.

## Isolated backend

`environment/run.mjs` launches the checked-in Anvil backend and the registered Playwright specs (`e2e:env playwright`), with data from the scenarios in `environment/scenarios/`. Run helper tests with `yarn workspace @safe-global/web e2e:env:test`: Node's test runner runs `environment/*.test.mjs`, `src/**/*.test.mjs` (unit tests of the Playwright helpers, such as `src/data/credentials.test.mjs`) and the mock tests. Preserve the fork hash, TXS indexing floor and CGW-visible scenario preconditions. Provider credentials must never reach the wallet or Playwright processes. Cypress does not run on the local stack.

`web-isolated-e2e-backend.yml` builds the wallet before backend startup and runs the Playwright specs in shards, each on its own backend, on the same ARM runner type. Require the `Isolated E2E result` job, not a shard, in branch protection. The backend action leaves containers running; the workflow must always attempt cleanup after tests. Native dependency and build caches include runner architecture. Chromium comes from the installed Playwright version. See [local setup](docs/ISOLATED_ENVIRONMENT.md) and [backend guidance](environment/infra/AGENTS.md).
