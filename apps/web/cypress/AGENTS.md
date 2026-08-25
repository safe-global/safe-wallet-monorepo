# Cypress E2E (legacy — maintenance only)

**No new Cypress tests.** All new E2E tests are Playwright — see [../e2e/AGENTS.md](../e2e/AGENTS.md). This file governs maintaining the existing suite (still active, mostly visual/Argos work). To migrate a spec: [../e2e/docs/CYPRESS_MIGRATION_GUIDE.md](../e2e/docs/CYPRESS_MIGRATION_GUIDE.md).

Run locally: `yarn workspace @safe-global/web cypress:open` (interactive) / `cypress:run` (headless).

## Directory layout

```
cypress/
├── e2e/
│   ├── pages/          # Page Object Model (*.page*.js)
│   ├── smoke/          # Functional smoke tests (CI on every PR)
│   ├── visual/         # Visual regression tests (Argos E2E)
│   ├── regression/     # Feature tests
│   ├── happypath/      # User journey tests
│   ├── happypath_2/    # User journey tests (run by the full on-demand CI suite)
│   └── safe-apps/      # Safe Apps tests
├── fixtures/           # Static test data (JSON, safes/)
├── support/            # Shared config, commands, constants, localstorage_data
└── COVERAGE.md         # Visual test coverage report + known gaps
```

## Test categories

| Category     | Folder             | CI trigger                           | Naming                    |
| ------------ | ------------------ | ------------------------------------ | ------------------------- |
| Smoke        | `e2e/smoke/`       | Every PR                             | `[SMOKE] Verify ...`      |
| Visual       | `e2e/visual/`      | `workflow_dispatch` only             | `[VISUAL] Screenshot ...` |
| Regression   | `e2e/regression/`  | On-demand + weekday cron (03:00 UTC) | `Verify ...`              |
| Happy path   | `e2e/happypath/`   | On-demand + Wed cron (04:00 UTC)     | `Verify ...`              |
| Happy path 2 | `e2e/happypath_2/` | Runs with the full on-demand suite   | `Verify ...`              |

## Visual regression tests (Argos E2E)

All visual tests in `e2e/visual/`. Argos captures screenshots via `afterEach` hook in `support/e2e.js`.

### Structure

```js
import { mockVisualTestApis } from '../../support/visual-mocks.js'

describe('[VISUAL] Feature screenshots', { defaultCommandTimeout: 60000, ...constants.VISUAL_VIEWPORT }, () => {
  before(async () => { staticSafes = await getSafes(CATEGORIES.static) })

  beforeEach(() => {
    mockVisualTestApis()  // Mock CGW APIs for deterministic screenshots
  })

  it('[VISUAL] Screenshot description', () => {
    cy.visit(...)
    cy.contains('expected text', { timeout: 30000 }).should('be.visible')
    main.awaitVisualStability()  // ALWAYS last line (unless explicitly skipped with comment)
  })
})
```

### Wallet tests

Use `wallet.connectSignerViaStorage(signer, url)` in `beforeEach` — it seeds storage and skips the slow UI flow of the older `connectSigner()` (still present in ~18 legacy call sites; don't add new ones).

### Key utilities

| Utility                     | Location                        | Purpose                                       |
| --------------------------- | ------------------------------- | --------------------------------------------- |
| `awaitVisualStability()`    | `pages/main.page.js`            | Wait for skeletons + settle before screenshot |
| `addToLocalStorage()`       | `pages/main.page.js`            | Set data before first visit                   |
| `addToAppLocalStorage()`    | `pages/main.page.js`            | Set data after visit (needs reload)           |
| `connectSignerViaStorage()` | `support/utils/wallet.js`       | Fast wallet connection via storage            |
| `getSafes()`                | `support/safes/safesHandler.js` | Get safe addresses                            |
| `VISUAL_VIEWPORT`           | `support/constants.js`          | Viewport config for visual tests              |
| `mockVisualTestApis()`      | `support/visual-mocks.js`       | Mock CGW APIs for deterministic visuals       |

### API mocking for visual tests

All visual tests call `mockVisualTestApis()` in `beforeEach()` to intercept CGW API endpoints with deterministic fixture data. This prevents flaky visual diffs caused by changing token prices, balances, and fiat values.

- Fixtures are shared with Storybook MSW via symlink: `fixtures/msw → config/test/msw/fixtures`
- Uses the `safe-token-holder` scenario for balances/portfolio/positions
- Mocks tx queue and history as empty by default
- Tests that need specific data (e.g., `tx_queue.cy.js` with pending transactions) call their own `cy.intercept()` AFTER `mockVisualTestApis()` to override (Cypress last-registered-wins)
- Chain config and safe info ARE mocked by `mockVisualTestApis()`: chains from `msw/chains/all.json`, safe info from `msw/safes/sepolia.json` with address/chainId patched from the request URL. Only nonces are not mocked (stable for static test safes)

## Test Body Structure

Each test must follow a clear **actions → assertions** pattern. The test body is split into three phases:

1. **Preconditions** (optional) — verify the page is in the expected state before acting (e.g. widget loaded, sidebar visible)
2. **Actions** — user interactions: clicks, navigation, typing. Use `click*` / `open*` / `expand*` / `type*` functions from page objects
3. **Assertions** — verify the outcome. Use `verify*` functions from page objects. Group all assertions at the end

### Rules

- **Never write raw Cypress commands in test files.** Every `cy.get(selector)`, `cy.url().should(...)`, or `cy.contains(label).click()` must be wrapped in a page object function.
- **Action functions** (click, open, expand, type, navigate) must not contain assertions about outcomes. They perform one user action.
- **Verify functions** must not perform actions. They only assert state (element visible, URL correct, text matches).
- **Reuse existing page object functions.** Before creating a new function, search all `*.page*.js` files for similar logic. If it exists, import and reuse.
- **Create general functions** when the same action/assertion pattern repeats across tests. Pass element selectors and expected values as parameters rather than creating one function per element.
- **No `cy.wait(N)` hard waits** — use assertion-based waits (`cy.get(sel, { timeout: 30000 }).should('be.visible')`); never commit `.only`.
- **Blank line between the action block and the assertion block**; extract repeated fixture paths to a `const` at the top of the test.

### Function Naming Convention

| Prefix    | Purpose                         | Example                            |
| --------- | ------------------------------- | ---------------------------------- |
| `click*`  | Click an element                | `clickAccountItemByIndex(index)`   |
| `open*`   | Open a dropdown/modal/panel     | `openSpaceSelector()`              |
| `expand*` | Expand a collapsible section    | `expandAccountRow(index)`          |
| `type*`   | Type into an input              | `typeSpaceName(name)`              |
| `visit*`  | Navigate to a URL               | `visitSpaceDashboard(id)`          |
| `verify*` | Assert state (visibility, URL…) | `verifySpaceSidebarItemsVisible()` |

## Page objects

- Organize each file in sections, in order: imports → selectors → labels/regex → internal helpers → actions → verifiers → composite flows. `export` only what test files use; internal selectors/helpers stay `const`.
- **Actions must wait for their result** (popover visible, page loaded) so the next step doesn't race the UI. Verify functions assert only.
- Placement: utilities used by 3+ page files → `main.page.js` (check its existing `verifyElementsCount`-style helpers first); wallet/navigation actions → `navigation.page.js`, imported by feature page objects — never duplicated.
- **Prefer one parameterized function** with a selector lookup table over near-identical per-variant functions.
- Composite flows (onboarding, account creation): private step functions composed into one exported function that reads as a plain sequence; each step handles its own waits.

## Selectors

ALL selectors in `e2e/pages/*.page*.js`. Never use raw selectors in `.cy.js` files.

Preference: `data-testid` > semantic HTML/ARIA > `cy.contains()` > never class names. Reuse existing test IDs; add new ones only when the element has none.

For links and external CTAs: use `data-testid` (or `actionTestId` on ActionCard) in the component and select by that in the page object. Do **not** use `cy.contains('a', ...)`, `.should('have.attr', 'href', ...)`, or `.and('have.attr', 'target', '_blank')`; add a testid only if missing, then assert visibility or behavior.

Adding a `data-testid` to a component:

- Values must be **unique** across components — give variants distinct prefixes (e.g. `single-account-name` vs `multichain-account-name`).
- Read the component source first: confirm the element actually renders where Cypress will look (accordion/expandable content differs from flat rows).
- Every testid added to source must be referenced by at least one page object selector — cross-check after the change.
- Regex assertions validate **format only**, never live values (`/\$[1-9][\d,]*/`, not `/\$875/`).

## Data setup

- Safe addresses: `getSafes(CATEGORIES.static)` — never hardcode
- localStorage: payloads in `support/localstorage_data.js`, keys in `support/constants.js`
- API mocks: `cy.intercept()` + `cy.fixture()` from `fixtures/`
- Do NOT create new setup helpers — use existing patterns from `support/`
- **Data/selector separation**: fixtures hold test data only (ids, names, addresses, counts); page objects hold selectors, labels, and regex only. Never duplicate fixture data in page objects, never re-export fixtures from them — tests import fixtures directly.
