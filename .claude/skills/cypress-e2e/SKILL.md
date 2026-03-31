---
name: cypress-e2e
description: Write or refactor Cypress E2E tests following Page Object Model, action/assertion separation, and project conventions. Use when creating new tests, refactoring existing ones, or adding page object functions.
argument-hint: '[test-description-or-file-path]'
allowed-tools:
  - Read
  - Edit
  - Write
  - Bash
  - Grep
  - Glob
  - Agent
---

# Cypress E2E Test Automation

Write or refactor Cypress E2E tests for **$ARGUMENTS**.

Read `apps/web/cypress/CLAUDE.md` and `apps/web/cypress/AGENTS.md` for project-specific conventions before proceeding.

## Phase 1: Understand Context

1. Read the relevant test file(s) and page object(s) in `apps/web/cypress/e2e/pages/`
2. Read `apps/web/cypress/CLAUDE.md` for conventions
3. Identify which page object file to use (or create)
4. Check existing functions in ALL `*.page*.js` files and `main.page.js` before creating anything new
5. Check the actual React component DOM to understand what `data-testid` attributes exist and which component renders them

## Phase 2: Page Object Structure

Organize page object files in clear sections with this order:

```js
// 1. Imports
// 2. Selectors — grouped by feature area, with comments
// 3. Labels & regex patterns
// 4. Internal helpers (selector builders, lookups)
// 5. Action functions (exported)
// 6. Verify functions (exported)
// 7. Composite flows (exported — multi-step sequences like onboarding)
```

### Selector Rules

- Use `data-testid` (preferred), `aria-label`, or semantic HTML — never class names
- If a component lacks a `data-testid`, add one to the React component
- Selectors only used within the page object: `const` (no `export`)
- Selectors used by test files: `export const`
- Before adding a new `data-testid`, check if one already exists on the element

### data-testid Rules

- **Every `data-testid` must be unique** — never reuse the same value across different components
- When similar UI elements exist in different contexts (e.g. single-chain vs multichain rows), use distinct prefixes:
  ```
  single-account-name      (AccountWidgetItem — single-chain)
  multichain-account-name  (AccountItemContent — expandable multichain)
  ```
- **Verify before adding**: read the React component source to confirm the element renders in the DOM where Cypress will look for it. An expandable/accordion row has different DOM structure than a flat row.
- **Every `data-testid` added to source must be referenced** in at least one Cypress page object selector. After adding test-ids, run a cross-reference check.
- **Never hardcode values in regex patterns or counts** — use format-only checks (e.g. `/\$[\s]*[1-9][\d,]*/` not `/\$875/`) since live data changes

### Function Rules

- **Action functions** (`click*`, `open*`, `expand*`, `type*`, `visit*`): perform one user action AND wait for the result to be ready. An action that opens a popover must wait for the popover to appear. An action that navigates must wait for the target page to load. This prevents flaky tests where the next step runs before the UI has settled:
  ```js
  // ✅ Good: action waits for result
  export function clickOnExpandWalletBtn() {
    cy.get(expandWalletBtn).should('be.visible').click()
    cy.get(sentinelStart).next().should('exist')  // wait for popover
  }

  // ❌ Bad: action with no wait — next step may fail
  export function clickOnExpandWalletBtn() {
    cy.get(expandWalletBtn).click()
  }
  ```
- **Verify functions** (`verify*`): assert state only, no user actions
- Functions used only within the page object: no `export`
- Functions used by test files: `export`
- General functions (3+ page files): put in `main.page.js`
- Page-specific functions: put in that page's `.pages.js`
- **Wallet/navigation functions belong in `navigation.page.js`** — not in feature page objects. Feature page objects import and call them. When the same action has different UI across contexts (e.g. legacy vs spaces wallet button), create separate functions in `navigation.page.js` rather than duplicating selectors in feature page objects:
  ```js
  // navigation.page.js — both wallet expand variants
  export function clickOnWalletExpandMoreIcon() { ... }  // legacy
  export function clickOnExpandWalletBtn() { ... }       // spaces

  // spaces.page.js — uses navigation, no local wallet selector
  export function disconnectFromSpaceLevel() {
    navigation.clickOnExpandWalletBtn()
    navigation.clickOnDisconnectBtn()
  }
  ```
- **Prefer one parameterized function over multiple similar functions** — use a type/variant parameter with a selector lookup table when the same verification applies to different component variants:
  ```js
  const selectors = {
    single: { name: singleName, address: singleAddress },
    multichain: { name: multichainName, address: multichainAddress },
  }
  export function verifyAccountRowDetails(type, rowIndex, details) {
    const sel = selectors[type]
    // ... use sel.name, sel.address etc.
  }
  ```
- **Check `main.page.js` first** for general utilities like `verifyElementsCount`, `verifyMinimumElementsCount`, `verifyValuesExist`, `verifyElementsIsVisible` — use them instead of writing custom versions

### Composite Flows

Multi-step flows (onboarding, account creation, member invite) should be split into small private helper functions and composed into one exported function:

```js
// Private step functions — not exported
function navigateToCreateSpacePage() { ... }
function submitSpaceName(name) { ... }
function skipSelectSafesStep() { ... }
function skipInviteMembersStep() { ... }
function verifySpaceDashboardLoaded() { ... }

// Exported composite flow — reads like a clear sequence
export function createSpaceViaOnboardingWithSkip(name) {
  navigateToCreateSpacePage()
  submitSpaceName(name)
  skipSelectSafesStep()
  skipInviteMembersStep()
  verifySpaceDashboardLoaded()
}
```

Rules for composite flows:
- Each step is a private function with a descriptive name
- The exported function reads as a plain-language sequence
- Step functions handle their own waits (URL checks, element visibility)
- When a page can be reached from multiple entry points, use a resilient pattern that waits for either state:
  ```js
  // Wait for EITHER the list page OR the form page to appear
  cy.get(`${listPageBtn}, ${formPageInput}`, { timeout: 30000 })
    .filter(':visible')
    .first()
    .then(($el) => {
      if (!$el.is(formPageInput)) {
        cy.wrap($el).click()
      }
    })
  ```

### Function Naming Convention

| Prefix      | Purpose                          | Example                                |
| ----------- | -------------------------------- | -------------------------------------- |
| `click*`    | Click an element                 | `clickAccountItemByIndex(index)`       |
| `open*`     | Open a dropdown/modal/panel      | `openSpaceSelector()`                  |
| `expand*`   | Expand a collapsible section     | `expandAccountRow(index)`              |
| `type*`     | Type into an input               | `typeSpaceName(name)`                  |
| `visit*`    | Navigate to a URL                | `visitSpaceDashboard(id)`              |
| `verify*`   | Assert state (visibility, URL)   | `verifySpaceSidebarItemsVisible()`     |

## Phase 3: Write Tests

### Test Structure

```js
it('Verify that [expected behavior]', () => {
  // 1. Preconditions — verify page is ready
  space.verifySpaceDashboardWidgetVisible('Accounts')

  // 2. Actions — user interactions
  space.clickAccountItemByIndex(0)

  // 3. Assertions — verify outcomes (grouped at the end)
  space.verifyAccountRowDetails('single', 0, { name: 'My Safe', address: '0x...' })
})
```

### Rules

- **Test names**: always `'Verify that [expected behavior]'`
- **No raw Cypress commands in test files**: every `cy.get()`, `cy.url().should()`, `cy.contains().click()` must be in a page object function
- **No hardcoded selectors in test files**: import from page objects
- **No `cy.wait(N)` hard waits**: use assertion-based waits (`cy.get(sel, { timeout: 30000 }).should('be.visible')`) or `waitFor*` functions
- **No `.only`**: never commit `it.only` or `describe.only`
- **No hardcoded amounts or counts in regex**: use format-only validation (e.g. `nonZeroBalanceRegex` not `$875Regex`)
- **Test data in fixtures**: put static data in `cypress/fixtures/`, not inline in tests. Use `staticSpaces`, `getSafes(CATEGORIES.static)`, etc.
- **Separate actions from assertions**: blank line between action block and assertion block
- **Reuse `main.verifyElementsCount`** for counting elements instead of inline `.should('have.length', N)`
- **Extract repeated data access**: if the same fixture path is referenced multiple times, extract to a `const` at the top of the test (e.g. `const safeData = staticSpaces.dashboardWithSafes.pendingTxAccount`)

### Test Data

- Safe addresses: `getSafes(CATEGORIES.static)` — never hardcode
- Static space data: `cypress/fixtures/spaces/staticSpaces.js`
- localStorage: payloads in `support/localstorage_data.js`, keys in `support/constants.js`
- API mocks: `cy.intercept()` + `cy.fixture()` from `fixtures/`

## Phase 4: Adding data-testid to Components

When a component needs a `data-testid` for E2E tests:

1. **Read the component source** to understand the DOM structure — especially for accordion/collapsible/expandable patterns where the trigger and content have different structures
2. **Check if different component variants exist** (e.g. `AccountWidgetItem` for single-chain vs `ExpandableAccountItem` for multichain) — they need distinct test-ids
3. **Add the `data-testid`** to the correct element in the correct component
4. **Verify the element will be visible** when Cypress looks for it — collapsed accordion content won't be found until expanded
5. **Add the corresponding selector** to the page object file
6. **Cross-reference**: after all changes, verify every new `data-testid` in source is referenced in at least one page object selector

## Phase 5: Data Separation

Keep test data and UI selectors in separate places — never mix them.

### Fixture files (`cypress/fixtures/`) — test data only
- Space IDs, names
- Account addresses, names, chain info, row indices
- Counts (row counts, sub-accounts)
- Sub-account chain details (chainId, query params)
- Any data that varies per environment or test scenario

### Page object files (`e2e/pages/`) — UI selectors and labels only
- `data-testid` selectors
- `aria-label` selectors
- Static UI text labels ("Getting started", "Add member", etc.)
- Regex patterns for format validation
- Functions (actions, verifiers)

### Rules
- **Never duplicate fixture data in page objects** — if an address or name is in a fixture, don't also define it as a `const` in the page object
- **Never put selectors in fixtures** — selectors belong in page objects
- **Never re-export fixtures from page objects** — tests should import fixtures directly (`import staticSpaces from '../../fixtures/spaces/staticSpaces.js'`)
- **Never import fixtures in page objects** unless a function internally needs the data (rare — prefer passing as parameters)
- **Regex patterns belong in page objects** not fixtures — they validate UI format, not test data

## Phase 6: Cleanup Checklist

After writing or refactoring tests, verify:

- [ ] No raw selectors in test files — all in page objects
- [ ] No unused `export` keywords — only export what test files import
- [ ] No dead exports — remove functions/consts not used anywhere
- [ ] Internal-only selectors and helpers are `const`/`function` (not `export`)
- [ ] No `cy.wait(N)` hard waits (except in legacy flows pending refactor)
- [ ] No `.only` left in tests
- [ ] No commented-out code left behind
- [ ] All `data-testid` added to source components are referenced in Cypress page objects
- [ ] No duplicate `data-testid` values across different components
- [ ] Test names follow "Verify that" format
- [ ] Parameterized functions with selector lookups used instead of duplicated functions
- [ ] No hardcoded amounts/counts in regex — format-only checks
- [ ] Page object file is organized in clear sections (selectors, labels, helpers, actions, verifiers, flows)
- [ ] No fixture data duplicated in page objects (addresses, names, counts)
- [ ] No fixture re-exports from page objects — tests import fixtures directly
- [ ] No unused imports in page objects or test files
