# Cypress E2E Tests

Full rules: `.cursor/rules/cypress-e2e.mdc`

## Directory layout

```
cypress/
├── e2e/
│   ├── pages/          # Page Object Model (*.pages.js, main.page.js)
│   ├── smoke/          # Functional smoke tests (CI on every PR)
│   ├── visual/         # Visual regression tests (Chromatic E2E, manual trigger only)
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

## Visual regression tests (Chromatic E2E)

All visual tests in `e2e/visual/`. Chromatic captures light + dark mode automatically (dark via `afterEach` hook in `support/e2e.js`).

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

All visual tests call `mockVisualTestApis()` in `beforeEach()` to intercept CGW API endpoints with deterministic fixture data. This prevents flaky Chromatic diffs caused by changing token prices, balances, and fiat values.

- Fixtures are shared with Storybook MSW via symlink: `fixtures/msw → config/test/msw/fixtures`
- Uses the `safe-token-holder` scenario for balances/portfolio/positions
- Mocks tx queue and history as empty by default
- Tests that need specific data (e.g., `tx_queue.cy.js` with pending transactions) call their own `cy.intercept()` AFTER `mockVisualTestApis()` to override (Cypress last-registered-wins)
- Safe info, chain config, and nonces are NOT mocked (stable for static test safes)

## Selectors

ALL selectors in `e2e/pages/*.pages.js`. Never use raw selectors in `.cy.js` files.

Preference: `data-testid` > semantic HTML/ARIA > `cy.contains()` > never class names.

## Data setup

- Safe addresses: `getSafes(CATEGORIES.static)` — never hardcode
- localStorage: payloads in `support/localstorage_data.js`, keys in `support/constants.js`
- API mocks: `cy.intercept()` + `cy.fixture()` from `fixtures/`
- Do NOT create new setup helpers — use existing patterns from `support/`
