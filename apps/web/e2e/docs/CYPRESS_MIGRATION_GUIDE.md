# Cypress Migration Guide — Mandatory Protocol

**When**: Before migrating any Cypress test to Playwright.

**Who must follow**: Any AI agent or human performing Cypress → Playwright migration.

**Core principle**: Migrate business value, not code.

---

## Step 1: Classify the Cypress Test

Before touching any code, answer all 8 questions for the Cypress test:

### Classification Checklist

| #   | Question                                               | Answer drives                                                          |
| --- | ------------------------------------------------------ | ---------------------------------------------------------------------- |
| 1   | What business risk does this test cover?               | Whether it's worth migrating at all                                    |
| 2   | Is the risk still relevant?                            | Features get removed, risks change — don't migrate dead tests          |
| 3   | Should this remain a UI test?                          | Many Cypress tests test logic that belongs at unit/component level     |
| 4   | Can setup move to API?                                 | Cypress tests often click through UI to set up state — use API instead |
| 5   | Can business validation move to API/integration tests? | If the assertion is about data, not rendering, it's not a UI test      |
| 6   | Should this test be deleted?                           | Flaky, duplicate, low-value, or testing removed features               |
| 7   | Should this stay temporarily in Cypress?               | If it works fine and migration adds no value yet, leave it             |
| 8   | Should this become a Playwright smoke test?            | Only critical user journeys earn a spot in smoke (runs every PR)       |

**If you can't clearly answer question 1, stop. The test has no documented business value and should not be migrated without clarification.**

---

## Step 2: Route to Migration Target

Based on classification, route each Cypress test to exactly one target:

| Cypress test type              | Migration target                             | Example                                                                    |
| ------------------------------ | -------------------------------------------- | -------------------------------------------------------------------------- |
| Critical UI flow               | Playwright UI `tests/smoke/` or `tests/e2e/` | Dashboard loads, tx creation flow, owner management                        |
| Business validation through UI | API/integration test + small UI check        | Balance correctness → API test + verify symbol renders                     |
| Setup through UI               | API setup in Playwright fixture              | "Click through Safe creation" → `safeApiClient.getSafeInfo()` precondition |
| Flaky low-value test           | Delete or redesign from scratch              | Tests that retry 3x and still fail weekly                                  |
| Duplicate test                 | Do not migrate                               | Same flow tested in smoke and regression with different names              |

### Decision tree

```
Cypress test file
  ├── Risk still relevant?
  │     ├── NO → Delete. Do not migrate.
  │     └── YES → Continue
  │
  ├── Is the core assertion about DATA (not UI rendering)?
  │     ├── YES → Write as API or integration test
  │     │          Add thin UI check only if rendering matters
  │     └── NO → Continue
  │
  ├── Is it a critical user journey (user would call support if broken)?
  │     ├── YES → Playwright smoke test (@smoke tag)
  │     └── NO → Continue
  │
  ├── Is it stable and providing value in Cypress today?
  │     ├── YES → Leave in Cypress for now. Migrate later.
  │     └── NO → Continue
  │
  ├── Is it flaky, slow, or duplicating another test?
  │     ├── YES → Delete. Do not migrate.
  │     └── NO → Playwright regression test (@regression tag)
  │
  └── None of the above → Flag for human review
```

---

## Step 3: Migrate (Only After Classification)

Once the target is clear, follow the [AI Test Output Format](./AI_TEST_OUTPUT_FORMAT.md) 12-step protocol to write the new test. Key migration-specific rules:

### Do

- Start from the **business requirement**, not the Cypress code
- Use API-first setup where Cypress used UI clicks
- Use Playwright locator priority (`getByRole` > `getByLabel` > `getByText` > `getByTestId`)
- Use web-first assertions (auto-retry) instead of Cypress retry chains
- Keep tests isolated — no `testIsolation: false` carry-over from Cypress patterns
- Tag appropriately: `@smoke` for critical path, `@regression` for feature-specific

### Do Not

- Translate `cy.get()` → `page.locator()` line by line
- Copy Cypress `beforeEach` → Playwright `beforeEach` without rethinking setup
- Preserve Cypress test structure if it doesn't fit Playwright patterns
- Migrate tests that use `cy.intercept()` for mocking — rethink whether the test needs a real API or belongs at integration level
- Keep Cypress test names — write new business-readable names

### Common Cypress → Playwright Traps

| Cypress pattern                    | Trap                            | Correct Playwright approach                                                                          |
| ---------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `cy.visit()` + `cy.get().should()` | Direct translation              | `page.goto()` + `await expect(locator).toBeVisible()` — but first ask if this needs a browser        |
| `cy.intercept()` + `cy.wait()`     | Mocking in UI test              | If testing API contract → write API test. If testing UI with known data → use API precondition check |
| `testIsolation: false`             | Shared state between tests      | Each Playwright test must be independent — use fixtures for shared setup                             |
| `cy.get('[data-testid="x"]')`      | Copy testid selectors           | Check if `getByRole` or `getByText` works first — testid is last resort                              |
| Cypress custom commands            | Translate to Playwright helpers | Rethink — most custom commands should become Page Object methods or fixture setup                    |
| `cy.wait(3000)`                    | Hard wait                       | `await expect(locator).toBeVisible()` — web-first assertions auto-retry                              |

---

## Migration Tracking

Record every migration in [CYPRESS_PW_MIGRATION_STATUS.md](./CYPRESS_PW_MIGRATION_STATUS.md) — the live queue and the source of truth for stage membership. **Update it in the same PR as the migration.**

For each test, document:

1. **Original file**: `cypress/e2e/smoke/dashboard.cy.js`
2. **Classification**: Critical UI flow → Playwright smoke
3. **New file**: `e2e/tests/smoke/dashboard.spec.ts`
4. **What changed**: Setup moved to API, 3 assertions removed (covered by unit tests), locators upgraded to getByRole
5. **Cypress file status**: Ready for deletion / Still needed for X

This tracking enables the eventual Cypress removal — we need to know when every valuable test has a Playwright equivalent.

### Review rule — Verdict before Status

**A PR that changes a spec's `Status` without also filling in its `Verdict` is incomplete. Reviewers: request changes.**

A blank `Verdict` next to a changed `Status` means one of two things, and both are worth a review comment:

- the classification never happened, and the spec was translated line by line — the exact failure this guide exists to prevent; or
- it happened in someone's head and is now lost, so the next person cannot tell whether a thin Playwright spec is thin _because the rest was correctly pushed down the pyramid_, or because it silently dropped coverage.

`Verdict` does not need prose. One line naming the routing decision is enough — `Critical UI flow → @smoke`, `Data assertion → @api test`, `Logic → unit test in useSafeInfo.test.ts`, `Duplicate of smoke/assets → won't-migrate`. What matters is that the decision is written down where the next reader will find it.

The same applies to `won't-migrate`: it is a legitimate and common outcome, but only with a `Verdict` saying which of the 8 questions produced it.

---

## Step 4: The Staged Programme

Migration runs as **one stage per PR**, easiest feature area first. Do not open a PR that spans stages.

**Scope: 122 specs.** The 31 Argos `visual/` specs are excluded — see [CYPRESS_PW_MIGRATION_STATUS.md](./CYPRESS_PW_MIGRATION_STATUS.md).

### Why staged

Three reasons, all of them load-bearing:

- **Page objects are ported once per area, then reused.** Ordering by area rather than by spec size means `assets.pages.js` gets ported once and serves all 10 specs in Stage 2. Ordering strictly by size would force you to port a slice of many page objects up front and revisit each repeatedly.
- **Each stage is independently verifiable.** A stage lands green or it does not land.
- **Both suites run in parallel throughout.** That is what makes deletion safe — see the loop below.

### Stage order

Counts are from `CYPRESS_PW_MIGRATION_STATUS.md`; consult it for exact membership.

| #   | Area                         | Specs | Why here                                                     | Main page object to port                   |
| --- | ---------------------------- | ----- | ------------------------------------------------------------ | ------------------------------------------ |
| 1   | **Pilot: landing**           | 1     | 7 lines, no page object, no wallet. Proves the loop.         | —                                          |
| 2   | Assets & balances            | 10    | Mostly read-only; `balances.spec.ts` + `safeApiClient` exist | `assets.pages.js` (430)                    |
| 3   | Tx history & details         | 14    | No wallet; `transactions.page.js` is only 96 lines           | `transactions.page.js` (96)                |
| 4   | Safe loading & import/export | 7     | No wallet, localStorage-driven                               | `load_safe` (286), `import_export` (177)   |
| 5   | Navigation & chrome          | 9     | Extends `home.page.ts`; closes the dashboard gap             | `sidebar` (740), `dashboard` (249)         |
| 6   | Address book & recipients    | 4     | Partly adjacent to the 3 `recipient-dropdown-*` specs        | `address_book.page.js` (243)               |
| 7   | Owner management             | 6     | First heavily wallet-gated stage; tag `@critical`            | `owners.pages.js` (292)                    |
| 8   | Tx creation & queue          | 15    | Largest page object in the repo; tag `@critical`             | `create_tx.pages.js` (1,236)               |
| 9   | Permissions & messages       | 11    | Role-dependent; tag `@permissions`                           | `spending_limits` (246), `proposers` (145) |
| 10  | Recovery & nested safes      | 9     | Multi-step flows                                             | `recovery` (201), `nestedsafes` (389)      |
| 11  | Multichain & safe creation   | 14    | Cross-chain + counterfactual state                           | `create_wallet.pages.js` (436)             |
| 12  | Swaps / CoW widget           | 11    | Third-party iframe                                           | `swaps.pages.js` (846)                     |
| 13  | Safe Apps & tx-builder       | 7     | Iframe-heavy, most complex                                   | `safeapps` (378), `copilot` (371)          |
| 14  | Spaces & remainder           | 4     | Extends `spaces-members-table.spec.ts`                       | `spaces.page.js` (731)                     |

### The per-stage loop

One stage = one PR. All eight steps, every time.

1. **Classify** every spec in the area against the 8 questions in Step 1 above. Write the verdict into `CYPRESS_PW_MIGRATION_STATUS.md` **before writing code**. Expect some specs to be deleted, some demoted to unit/component tests, some turned into `@api` tests.
   > A stage that migrates fewer specs than it started with is a success, not a shortfall. Migrate business value, not code.
2. **Write** the Playwright specs per [AI_TEST_OUTPUT_FORMAT.md](./AI_TEST_OUTPUT_FORMAT.md). Tag `@migration` plus the category tag; the tag must match the directory.
3. **Stability gate** — `--repeat-each=10` must be 10/10. This is the README's existing rule, not a new one.
4. **No regression in already-migrated work** — the full Playwright suite must be green.
5. **Prove the Cypress spec still passes** before deleting it. Never delete an already-broken spec: the diff would hide a real failure, and you would not know whether the new test is weaker.
6. **Delete** the Cypress spec and any page-object functions it alone used. Update `CYPRESS_PW_MIGRATION_STATUS.md` to `deleted`.
7. **Re-run the Cypress suite.** ← _the real hazard in this migration._ Page objects are shared across specs, including with the excluded `visual/` specs, so removing helpers can break tests you never touched. **Non-negotiable.**
8. **Add unit/component tests** for whatever step 1 pushed down the pyramid, plus a unit guard for any new `data-testid` you add to app source (see Known hazards).

```bash
# From apps/web/, with the dev server on :3000
unset ELECTRON_RUN_AS_NODE   # VSCode only (xtension host sets this); it breaks Cypress
export CYPRESS_WALLET_CREDENTIALS=**provide the env variable**

# 3. Stability gate
npx playwright test --config=e2e/playwright.config.ts <new-specs> --repeat-each=10

# 4. Whole Playwright suite
npx playwright test --config=e2e/playwright.config.ts --reporter=list

# 5 + 7. Cypress before and after deletion — the two runs must match
yarn cypress:run --browser chrome --spec 'cypress/e2e/<area>/*.cy.js' --config retries=0,video=false
```

### Prerequisites — first engineer to hit these does them

Deliberately not built up front. Do them when your stage needs them, then delete the bullet.

- **Shared route-mock helper.** `page.route` for `/v1/auth/me`, `/v1/users` and `/v1/spaces/*` is currently copy-pasted across `tests/regression/spaces-members-table.spec.ts` and both `recipient-dropdown-*` specs. Whoever needs it a fourth time extracts it into `e2e/src/api/mocks.ts`.
- **Safe registry expansion.** `SAFES` in `e2e/src/data/constants.ts` holds 3 entries. Cypress has ~30 in `cypress/fixtures/safes/static.js` plus `funds.json`, `nfts.json`, `recovery.json` and `safeapps.json`. Port only the entries your stage needs, keeping the existing naming (`SEP_STATIC_SAFE_n`).
- **Page objects.** Cypress has 25 page objects totalling ~9,100 lines; Playwright has two. Do **not** port a Cypress page object line by line — the Playwright ones are thin (locators and actions only, no assertions) and are typically a fraction of the size.

### Known hazards

Each of these actually happened in this repo. They are not hypotheticals.

| Hazard                                                    | Real example                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Guard                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A testid disappears after the locator is written          | `safe-header-info` lived in `sidebar/SidebarHeader/SafeHeaderInfo.tsx`; a dead-code cleanup deleted the component a month after the Playwright locator was added, and nothing caught it                                                                                                                                                                                                                                                                                         | Add a unit test asserting the testid renders, in the component's own test file                                                                                                                                                                                                                                                                                                            |
| A spec references a testid the app never shipped          | `address-book-toggle` was referenced by a spec added in the "Improved address book dropdown" PR, but that PR only added `address-item` and `contact-group-header`                                                                                                                                                                                                                                                                                                               | Grep app source for the testid before trusting a spec that uses it                                                                                                                                                                                                                                                                                                                        |
| A locator's DOM assumption silently breaks                | `getByTestId('private-key-input').locator('input')` was correct under MUI's `TextField` (testid on a wrapper) and wrong after the shadcn migration (testid on the bare `<input>`)                                                                                                                                                                                                                                                                                               | Prefer `getByRole`/`getByLabel`; when using a testid, do not assume wrapper-vs-element                                                                                                                                                                                                                                                                                                    |
| Deleting shared page-object helpers                       | 25 Cypress page objects are shared across specs _and_ with the excluded `visual/` specs                                                                                                                                                                                                                                                                                                                                                                                         | Loop step 7                                                                                                                                                                                                                                                                                                                                                                               |
| Data-exact assertions against live Safes                  | The static test Safes are real on Sepolia; balances and tx history drift                                                                                                                                                                                                                                                                                                                                                                                                        | Derive expectations from `safeApiClient` instead of hard-coding values                                                                                                                                                                                                                                                                                                                    |
| **The Beamer widget covers buttons** — known gap, unfixed | Cypress guards it twice: it seeds `_BEAMER_FIRST_VISIT_${PRODUCT_ID}` from the `BEAMER_DATA_E2E` secret, _and_ `main.page.js` has `blockBeamer()` to 204 the widget script because its popup "covers onboarding buttons". The Playwright fixture seeds those keys **without** the `PRODUCT_ID` suffix, so its suppression is almost certainly inert — and it sets `updates: true`, which is the consent that loads Beamer ([useBeamer.ts](../../src/hooks/Beamer/useBeamer.ts)) | **Bites from Stage 5 onward** (`sidebar.pages.js`, then `address_book.page.js`, `spaces.page.js`). Symptom is a click landing on an overlay, and it will not mention Beamer. Fix when you reach it: set `updates: false` in the fixture's `COOKIE_STATE` (simplest — Beamer never loads), or `page.route` the `getbeamer.com` script to mirror `blockBeamer()`. Stages 1–4 are unaffected |

**All three testid failures share one root cause: nothing in CI ran the Playwright suite, so the rot was invisible.** That is now fixed (`web-pw-smoke.yml`), but it only guards `@smoke` and `@api` on PRs — `@regression` runs on demand. Do not assume a green PR means your regression specs still pass.
