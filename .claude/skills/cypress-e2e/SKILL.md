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

- **Action functions** (`click*`, `open*`, `expand*`, `type*`, `visit*`): perform one user action, no assertions about outcomes
- **Verify functions** (`verify*`): assert state only, no user actions
- Functions used only within the page object: no `export`
- Functions used by test files: `export`
- General functions (3+ page files): put in `main.page.js`
- Page-specific functions: put in that page's `.pages.js`
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
- **Inline single-use helpers** — if a helper function is only called by one parent function, inline it rather than creating a separate function
- **Check `main.page.js` first** for general utilities like `verifyElementsCount`, `verifyMinimumElementsCount`, `verifyValuesExist`, `verifyElementsIsVisible` — use them instead of writing custom versions

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

## Phase 5: Cleanup Checklist

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
