# Cypress E2E Tests

Full rules: `.cursor/rules/cypress-e2e.mdc`

## Directory layout

```
cypress/
├── e2e/
│   ├── pages/          # Page Object Model (*.pages.js, main.page.js)
│   ├── smoke/          # Functional smoke tests (CI on every PR)
│   ├── visual/         # Visual regression tests (Argos E2E)
│   ├── regression/     # Feature tests
│   ├── happypath/      # User journey tests
│   └── safe-apps/      # Safe Apps tests
├── fixtures/           # Static test data (JSON, safes/)
├── support/            # Shared config, commands, constants, localstorage_data
└── COVERAGE.md         # Visual test coverage report + known gaps
```

## Test categories

| Category   | Folder            | CI trigger               | Naming                    |
| ---------- | ----------------- | ------------------------ | ------------------------- |
| Smoke      | `e2e/smoke/`      | Every PR                 | `[SMOKE] Verify that ...` |
| Visual     | `e2e/visual/`     | `workflow_dispatch` only | `[VISUAL] Screenshot ...` |
| Regression | `e2e/regression/` | On-demand                | `Verify that ...`         |
| Happy path | `e2e/happypath/`  | On-demand                | `Verify that ...`         |

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

Use `wallet.connectSigner(signer)` in `beforeEach`, not in individual `it` blocks.

### Key utilities

| Utility                  | Location                        | Purpose                                       |
| ------------------------ | ------------------------------- | --------------------------------------------- |
| `awaitVisualStability()` | `pages/main.page.js`            | Wait for skeletons + settle before screenshot |
| `addToLocalStorage()`    | `pages/main.page.js`            | Set data before first visit                   |
| `addToAppLocalStorage()` | `pages/main.page.js`            | Set data after visit (needs reload)           |
| `connectSigner()`        | `support/utils/wallet.js`       | Connect wallet in tests                       |
| `getSafes()`             | `support/safes/safesHandler.js` | Get safe addresses                            |
| `VISUAL_VIEWPORT`        | `support/constants.js`          | Viewport config for visual tests              |
| `mockVisualTestApis()`   | `support/visual-mocks.js`       | Mock CGW APIs for deterministic visuals       |

### API mocking for visual tests

All visual tests call `mockVisualTestApis()` in `beforeEach()` to intercept CGW API endpoints with deterministic fixture data. This prevents flaky visual diffs caused by changing token prices, balances, and fiat values.

- Fixtures are shared with Storybook MSW via symlink: `fixtures/msw → config/test/msw/fixtures`
- Uses the `safe-token-holder` scenario for balances/portfolio/positions
- Mocks tx queue and history as empty by default
- Tests that need specific data (e.g., `tx_queue.cy.js` with pending transactions) call their own `cy.intercept()` AFTER `mockVisualTestApis()` to override (Cypress last-registered-wins)
- Safe info, chain config, and nonces are NOT mocked (stable for static test safes)

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

### Example

```js
// ✅ Good: actions then assertions, all via page object functions
it('Verify that clicking an account row opens the Safe dashboard', () => {
  space.verifySpaceDashboardWidgetVisible('Accounts')

  space.clickAccountItemByIndex(0)

  space.verifySafeDashboardUrlSafeQuery('sep:0x1234...')
  space.verifySafeNameInSafeLevelNavigation('My Safe')
})

// ❌ Bad: inline selectors, mixed actions and assertions
it('Verify that clicking an account row opens the Safe dashboard', () => {
  cy.get('[data-testid="space-dashboard-accounts-widget"]').should('be.visible')
  cy.get('[data-testid="space-dashboard-accounts-row-0"]').click()
  cy.url().should('include', '/home')
  cy.get('[data-testid="safe-selector-trigger-name"]').should('contain.text', 'My Safe')
})
```

### Function Naming Convention

| Prefix    | Purpose                         | Example                            |
| --------- | ------------------------------- | ---------------------------------- |
| `click*`  | Click an element                | `clickAccountItemByIndex(index)`   |
| `open*`   | Open a dropdown/modal/panel     | `openSpaceSelector()`              |
| `expand*` | Expand a collapsible section    | `expandAccountRow(index)`          |
| `type*`   | Type into an input              | `typeSpaceName(name)`              |
| `visit*`  | Navigate to a URL               | `visitSpaceDashboard(id)`          |
| `verify*` | Assert state (visibility, URL…) | `verifySpaceSidebarItemsVisible()` |

## Selectors

ALL selectors in `e2e/pages/*.pages.js`. Never use raw selectors in `.cy.js` files.

Preference: `data-testid` > semantic HTML/ARIA > `cy.contains()` > never class names. Reuse existing test IDs; add new ones only when the element has none.

For links and external CTAs: use `data-testid` (or `actionTestId` on ActionCard) in the component and select by that in the page object. Do **not** use `cy.contains('a', ...)`, `.should('have.attr', 'href', ...)`, or `.and('have.attr', 'target', '_blank')`; add a testid only if missing, then assert visibility or behavior.

## Data setup

- Safe addresses: `getSafes(CATEGORIES.static)` — never hardcode
- localStorage: payloads in `support/localstorage_data.js`, keys in `support/constants.js`
- API mocks: `cy.intercept()` + `cy.fixture()` from `fixtures/`
- Do NOT create new setup helpers — use existing patterns from `support/`
