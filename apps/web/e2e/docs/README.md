# Safe Wallet — Playwright E2E Tests

## Philosophy

This framework follows three principles in strict order:

1. **Simple before clever** — no abstractions until you need them twice
2. **API-first, not UI-heavy** — use the CGW API for setup/verification; reserve Playwright for what only a browser can test
3. **Stable in CI** — every test must pass 10 consecutive runs before merge

## Quick Start

```bash
# From apps/web/
yarn pw:test              # Run all tests
yarn pw:test:smoke        # Run @smoke tagged tests only
yarn pw:test:api          # Run @api tagged tests only
yarn pw:report            # Open last HTML report
```

### CI mode

```bash
CI=true yarn pw:ci        # Smoke tests with retries, JUnit output
```

## Project Structure

```
e2e/
├── playwright.config.ts       # Chromium-only, traces on failure
├── tsconfig.json              # TypeScript config for e2e
├── tests/                     # Tests describe business behavior, not implementation
│   ├── smoke/                 # Critical path — run on every PR
│   ├── api/                   # Pure API tests (no browser)
│   ├── e2e/                   # Full user flows
│   ├── regression/            # Bug-specific regression tests
│   └── one-shots/             # Temporary per-PR happy-path clickthroughs (recorded as a GIF)
├── src/                       # Framework code (not tests)
│   ├── pages/                 # Page interactions (locators + actions, NO assertions)
│   ├── api/                   # API clients (CGW, TX Service)
│   ├── fixtures/              # Custom Playwright fixtures (safePage, safeApiClient)
│   ├── data/                  # Constants, test addresses, URLs, and data factories/builders
│   ├── utils/                 # Shared helpers
│   └── types/                 # TypeScript types
├── docs/                      # Decisions and standards — the "why" behind the framework
│   ├── README.md              # This file — philosophy, rules, patterns
│   ├── AI_TEST_OUTPUT_FORMAT.md   # 12-step protocol for AI test generation
│   ├── CYPRESS_MIGRATION_GUIDE.md # Cypress → Playwright migration protocol
│   └── developer-testability-contract.md  # What QA needs from dev code
└── reports/                   # Generated — gitignored
```

## Test Level Decision Rule

Before writing any test, answer: **What is the right test level?**

| Signal                                    | Test Level                        |
| ----------------------------------------- | --------------------------------- |
| Pure business logic (parsing, validation) | Unit test                         |
| Component renders correctly               | Component test (Jest/RTL)         |
| API returns correct data                  | API test (`@api` tag)             |
| UI renders data from backend              | Hybrid (API setup → UI verify)    |
| Full user flow through UI                 | Playwright UI (`@smoke` / `@e2e`) |
| Exploratory / edge cases                  | Manual                            |
| Not automatable                           | Don't automate                    |

**Default:** if unsure, don't automate yet — create a manual test case first.

## One-shot clickthroughs

A **one-shot** is a complete happy-path clickthrough of the feature a PR adds or fixes. It runs once and produces a single video recording, which CI converts to a GIF and posts as a PR comment — so reviewers can _watch_ the new flow without checking out the branch.

One-shots are an integral part of feature development: for every non-trivial web feature/bugfix, the author (including AI agents) adds a one-shot under `tests/one-shots/` and runs it locally before opening the PR. You do **not** manually attach a video or paste any URL into the PR — CI records and posts the GIF automatically.

The suite is **temporary**: one-shots are periodically pruned, or promoted into `tests/regression/` once they prove stable.

- **Tag:** `@one-shot`
- **Directory:** `tests/one-shots/`
- **Playwright project:** `one-shots` (records one video per run via `video: 'on'`)

### Run it locally

```bash
# Start a local dev server (in another terminal):
yarn workspace @safe-global/web dev

# Record + preview the one-shot (defaults to http://localhost:3000):
yarn workspace @safe-global/web pw:oneshot:record
```

`pw:oneshot:record` runs the `one-shots` project, then reuses `scripts/github/video_to_gif.sh` to write `e2e/reports/one-shots/clickthrough.gif` and `.mp4` for local preview. To point at a different target, set `PLAYWRIGHT_BASE_URL`:

```bash
PLAYWRIGHT_BASE_URL=https://my-preview.example yarn workspace @safe-global/web pw:oneshot:record
```

After the PR preview deploys, CI runs **only the one-shot specs the PR adds or modifies** (not the whole directory) against the preview, converts the recording, and posts the GIF in a PR comment automatically. PRs that don't touch `tests/one-shots/` get a nudge comment instead of a recording.

### Wallet-connected one-shots

One-shots can drive a connected wallet and SiWE-login using the framework helpers. Pull the `walletPage` and `credentials` fixtures, then:

```typescript
test('...', async ({ safePage, walletPage, credentials }) => {
  await walletPage.connectWallet(credentials.OWNER_4_PRIVATE_KEY) // web3-onboard "Private key" module, no mocks
  await walletPage.signInWithEthereum() // SiWE on screens with an explicit sign-in button; PK module signs programmatically, no popup
})
```

See `safe-creation-paylater.spec.ts` for a complete example: it connects a wallet, steps through the new Safe creation wizard, and triggers SiWE by selecting "Pay later" (a counterfactual Safe — no on-chain tx, no funds).

Wallet one-shots require `CYPRESS_WALLET_CREDENTIALS` (the same secret Cypress uses) to be set locally; CI passes it automatically.

## Writing Tests

### Import from fixtures, not from @playwright/test

```typescript
// ✅ Correct
import { test, expect } from '../../src/fixtures/test.fixture'

// ❌ Wrong — bypasses localStorage seeding
import { test, expect } from '@playwright/test'
```

### Tags and Test Categories

Use tags in `test.describe()`:

```typescript
test.describe('Feature name', { tag: '@smoke' }, () => { ... })
```

Use categories intentionally:

| Tag            | Purpose                           | Rules                                                                                                                                       |
| -------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `@smoke`       | Critical path — runs every PR     | Must be small and stable. If it flakes, fix immediately or demote.                                                                          |
| `@regression`  | Feature-specific — runs on-demand | Can be broader but must still provide clear value.                                                                                          |
| `@api`         | Pure API tests — no browser       | Fast, stable, run every PR alongside smoke.                                                                                                 |
| `@ui`          | UI-specific rendering checks      | Only for things that require visual/browser verification.                                                                                   |
| `@critical`    | High-risk business flows          | Transaction creation, signing, owner changes — financial impact.                                                                            |
| `@permissions` | Role-based access tests           | Owner vs non-owner, proposer, threshold-dependent flows.                                                                                    |
| `@flaky`       | Quarantined flaky tests           | Temporary tag. Flaky tests must be fixed, quarantined, or removed — never ignored silently.                                                 |
| `@migration`   | Migrated from Cypress             | Tracks migration progress. Remove tag once test is stable in Playwright.                                                                    |
| `@one-shot`    | Per-PR happy-path clickthrough    | Temporary; recorded as a GIF by CI. Pruned or promoted to `@regression` once stable. See [One-shot clickthroughs](#one-shot-clickthroughs). |

**Tag must match directory.** A `@smoke` test lives in `tests/smoke/`, a `@api` test in `tests/api/`, etc. If unsure, default to `tests/regression/` — promotion to `tests/smoke/` is a deliberate decision after the test proves stable.

**Flaky test policy**: A test tagged `@flaky` is excluded from CI smoke runs. It must have an owner and a deadline to fix. If not fixed within 2 weeks, it gets deleted. Flaky tests that are silently skipped erode trust in the entire suite.

### Page Objects — thin

Page Objects hold **locators** and **actions** only. **Assertions belong in the test.**

```typescript
// ✅ In the Page Object
async goto(safe: string) { await this.page.goto(`/home?safe=${safe}`) }

// ❌ Never in the Page Object
async verifyLoaded() { expect(this.header).toBeVisible() }  // assertion in POM
```

### Assertion Philosophy

Four rules for every assertion:

1. **Assert visible user behavior** — what the user sees, not internal state
2. **Assert important state changes** — meaningful transitions, not every intermediate step
3. **Do not over-assert implementation details** — test WHAT, not HOW
4. **Do not duplicate API business logic in UI assertions** — if the API test already validates data correctness, the UI test only checks that data renders

Use web-first assertions (auto-retrying). Never extract text and assert on it manually.

```typescript
// ✅ Good — web-first, role-based, user-visible
await expect(page.getByRole('alert')).toContainText('Email is required')
await expect(page.getByRole('button', { name: 'Save' })).toBeDisabled()
await expect(page.getByRole('heading', { name: user.name })).toBeVisible()

// ❌ Avoid — non-retrying, implementation-coupled
expect(await locator.textContent()).toBe('Saved')
```

### Locator Priority

1. `getByRole()` — most accessible, most stable
2. `getByLabel()` — for form fields
3. `getByText()` — for visible text
4. `getByTestId()` — last resort (coupled to implementation)

### No Hard Waits

**Principle: Waiting for time is not waiting for readiness.**

`page.waitForTimeout()` is never acceptable. Unless the AI gives a very strong reason, and even then it must propose a better alternative.

Approved alternatives — use these instead:

1. **Locator assertions** — `await expect(locator).toBeVisible()` / `.toHaveText()` / `.toBeEnabled()`
2. **Response waiting** — `await page.waitForResponse(url => url.includes('/api/v1/safes'))`
3. **URL assertions** — `await expect(page).toHaveURL(/\/home/)`
4. **State assertions** — `await expect(locator).toHaveAttribute('aria-selected', 'true')`
5. **API polling** — `await safeApiClient.waitForCondition(...)` when no UI signal exists
6. **App-specific stable signals** — wait for a loading spinner to disappear, a skeleton to resolve, or a known data element to render

```typescript
// ✅ Web-first assertion — auto-retries
await expect(page.getByText('Dashboard')).toBeVisible()

// ✅ Wait for API response
await page.waitForResponse((resp) => resp.url().includes('/v1/safes') && resp.status() === 200)

// ❌ Never — arbitrary time, not readiness
await page.waitForTimeout(3000)
```

### API-First Setup Pattern

```typescript
test('balance page shows tokens', async ({ safePage, safeApiClient }) => {
  // 1. API: get expected data
  const balances = await safeApiClient.getBalances(address)

  // 2. UI: navigate
  await safePage.goto(`/balances?safe=${safe}`)

  // 3. Verify: UI matches API
  await expect(safePage.getByText(balances.items[0].tokenInfo.symbol)).toBeVisible()
})
```

## Parallel Execution Rule

Tests run in parallel in CI (`fullyParallel: true`). Every test must be designed for independent execution. Follow these rules strictly:

1. **No shared mutable test data** — if a test writes to a Safe (creates a tx, changes settings), it must use its own dedicated Safe, not one shared with other tests.
2. **No test depends on another test** — each test must set up its own preconditions. Never rely on execution order.
3. **No fixed user/object unless read-only** — shared static test Safes in `constants.ts` are fine for read-only verification (check balances, check owners). If the test mutates state, use a dedicated Safe.
4. **No global state changes without isolation** — localStorage is scoped per browser context (Playwright handles this). But shared backend state (CGW, tx service) is not isolated — be careful with mutations.
5. **Use unique names/IDs** — if a test creates an address book entry or label, use a unique name (e.g., include `testInfo.testId`) to avoid collisions.
6. **Use separate Safes when needed** — if two tests both need to modify a Safe's owner list, they cannot share a Safe. Allocate separate test Safes.

```typescript
// ✅ Read-only: safe to share across parallel tests
test('dashboard shows balance', async ({ safePage }) => {
  await safePage.goto('/home?safe=' + SAFES.SEP_STATIC_SAFE_2) // read-only
  await expect(safePage.getByText('ETH')).toBeVisible()
})

// ❌ Mutation: must NOT use a shared Safe
test('create transaction', async ({ safePage }) => {
  await safePage.goto('/home?safe=' + SAFES.SEP_STATIC_SAFE_2) // WRONG — other tests use this Safe
  // ... creates a tx, changes nonce — breaks parallel tests
})
```

## Environment Variables

| Variable              | Default                                        | Description                                                    |
| --------------------- | ---------------------------------------------- | -------------------------------------------------------------- |
| `CI`                  | (unset)                                        | Set to `true` in CI — enables retries, parallel workers, JUnit |
| `PLAYWRIGHT_BASE_URL` | `localhost:3000` (dev) / `localhost:8080` (CI) | App URL                                                        |
| `SAFE_CGW_BASE_URL`   | `https://safe-client.staging.5afe.dev`         | CGW API URL                                                    |
| `WALLET_CREDENTIALS`  | (unset)                                        | Private key for wallet connection (future)                     |

## Debugging a Failed Test

When a test fails in CI or locally, follow these steps in order.

### Step 1: Open the HTML report

```bash
yarn pw:report
```

The report shows every test with pass/fail status. Click a failed test to see the screenshot at the failure point and all attached evidence.

### Step 2: Check failure attachments

Our test fixture automatically attaches 6 types of evidence on failure:

| Attachment                | What it tells you                                                                   |
| ------------------------- | ----------------------------------------------------------------------------------- |
| `page-url-on-failure`     | The exact URL the browser was on when it failed — start here                        |
| `console-errors`          | JavaScript errors (`TypeError`, `ReferenceError`) = app bug                         |
| `console-warnings`        | React prop warnings, deprecation notices, hydration issues = root cause clues       |
| `failed-network-requests` | 502/503 from CGW = staging issue (re-run), 404 = wrong endpoint, 401 = auth problem |
| `environment-info`        | baseURL, CGW URL, browser, retry count, worker index                                |
| `test-data`               | Safe address used in the test (if annotated)                                        |

### Step 3: Open the trace

```bash
npx playwright show-trace e2e/test-results/<test-folder>/trace.zip
```

The trace viewer shows a step-by-step replay with DOM snapshots, network calls, and console output at each action. This is the most powerful debugging tool — you can see exactly what the page looked like at every step.

### Step 4: Watch the video

Video files are in `e2e/test-results/<test-folder>/video.webm`. Open in any browser or video player to see the full test recording in real time.

### Step 5: Reproduce locally

```bash
# Run the specific failing test
yarn pw:test --grep "should display token balances"

# Run with headed browser to watch it live
yarn pw:test --grep "should display token balances" --headed

# Run with Playwright Inspector for step-by-step debugging
PWDEBUG=1 yarn pw:test --grep "should display token balances"
```

### Common failure patterns

| You see                                    | Likely cause                                 | Action                                                                |
| ------------------------------------------ | -------------------------------------------- | --------------------------------------------------------------------- |
| `console-errors` with `TypeError`          | App bug — component received unexpected data | File a bug, not a test issue                                          |
| `failed-network-requests` with 502/503     | CGW staging is down or flaky                 | Re-run the test — if it passes, it's transient                        |
| `page-url` shows wrong page                | Navigation failed or redirected              | Check if the Safe address is valid, check for redirects               |
| `TimeoutError: waiting for getByRole(...)` | Element didn't render in time                | Check if the locator is correct, check for loading states             |
| Test passes locally, fails in CI           | Timing difference or missing env var         | Check `environment-info` attachment, try `CI=true yarn pw:ci` locally |
| `console-warnings` with hydration mismatch | Server/client render mismatch                | Developer issue — flag to the team                                    |

### Failure artifact locations

All stored in `e2e/test-results/` (gitignored):

- **Trace** — `trace.zip` (open with `npx playwright show-trace`)
- **Screenshot** — `test-failed-1.png` (viewport at failure point)
- **Video** — `video.webm` (full test recording)

## Playwright MCP — AI-Assisted Testing (Phase 2)

`@playwright/mcp` is the official Microsoft MCP server that exposes Playwright browser automation as structured tools for AI agents. Instead of screenshot-based guessing, the AI reads the browser's accessibility tree — making interactions fast and reliable.

```bash
npx @playwright/mcp@latest
```

### Planned use cases

**1. Locator discovery** — AI runs `browser_snapshot` on the real staging app and generates locators from the actual accessibility tree. Produces `getByRole('button', { name: 'Send' })` from the real DOM, not from assumptions.

**2. Exploratory testing** — Tell the AI: "Navigate to the dashboard for this Safe, check all visible elements, report anything broken." The AI navigates, reads the tree at each step, and reports findings without writing a test file.

**3. Test generation from running app** — AI navigates a user flow, records the accessibility tree at each step, and generates a Playwright test following the 12-step protocol with real locators.

**4. QA Review Companion integration** — After reviewing PR code, the AI launches a browser against the feature branch, verifies the change, and validates locators before generating tests.

### Status

This is a Phase 2 integration. The framework foundation must be stable first. Current blockers: requires a running staging app for locator discovery, and QA skill updates for review integration.

## Relationship to Cypress

Playwright runs alongside Cypress during migration. New tests go in Playwright. Existing Cypress tests are migrated gradually. Both frameworks share the same test Safes on Sepolia staging.
