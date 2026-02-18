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
describe('[VISUAL] Feature screenshots', { defaultCommandTimeout: 60000, ...constants.VISUAL_VIEWPORT }, () => {
  before(async () => { staticSafes = await getSafes(CATEGORIES.static) })

  it('[VISUAL] Screenshot description', () => {
    cy.visit(...)
    cy.contains('expected text', { timeout: 30000 }).should('be.visible')
    main.verifySkeletonsGone()  // ALWAYS last line (unless explicitly skipped with comment)
  })
})
```

### Animation settling

`main.waitForMuiAnimationsToSettle()` — call after any click/toggle that triggers MUI animation (button ripple, modal slide-in, accordion expand, dropdown open). Without this, screenshots capture mid-animation state causing flaky Chromatic diffs.

```js
owner.clickOnAddSignerBtn()
main.waitForMuiAnimationsToSettle() // ripple + modal transition
cy.contains('Add new signer', { timeout: 10000 }).should('be.visible')
main.verifySkeletonsGone()
```

### Wallet tests

Use `wallet.connectSigner(signer)` in `beforeEach`, not in individual `it` blocks.

### Key utilities

| Utility                          | Location                        | Purpose                                 |
| -------------------------------- | ------------------------------- | --------------------------------------- |
| `verifySkeletonsGone()`          | `pages/main.page.js`            | Wait for all MUI skeletons to disappear |
| `waitForMuiAnimationsToSettle()` | `pages/main.page.js`            | 1s settle after MUI animations          |
| `addToLocalStorage()`            | `pages/main.page.js`            | Set data before first visit             |
| `addToAppLocalStorage()`         | `pages/main.page.js`            | Set data after visit (needs reload)     |
| `connectSigner()`                | `support/utils/wallet.js`       | Connect wallet in tests                 |
| `getSafes()`                     | `support/safes/safesHandler.js` | Get safe addresses                      |
| `VISUAL_VIEWPORT`                | `support/constants.js`          | Viewport config for visual tests        |

## Selectors

ALL selectors in `e2e/pages/*.pages.js`. Never use raw selectors in `.cy.js` files.

Preference: `data-testid` > semantic HTML/ARIA > `cy.contains()` > never class names.

## Data setup

- Safe addresses: `getSafes(CATEGORIES.static)` — never hardcode
- localStorage: payloads in `support/localstorage_data.js`, keys in `support/constants.js`
- API mocks: `cy.intercept()` + `cy.fixture()` from `fixtures/`
- Do NOT create new setup helpers — use existing patterns from `support/`
