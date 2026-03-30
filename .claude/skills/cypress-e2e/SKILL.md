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
4. Check existing functions in page objects — search all `*.page*.js` files before creating anything new

## Phase 2: Page Object Functions

All selectors and interactions go in page object files (`e2e/pages/*.page.js` or `*.pages.js`).

### Selector Rules

- Use `data-testid` attributes (preferred), `aria-label`, or semantic HTML — never class names
- If a component lacks a `data-testid`, add one to the React component
- Selectors only used within the page object file: use `const` (no `export`)
- Selectors used by test files: use `export const`
- Before adding a new `data-testid`, check if one already exists on the element

### Function Rules

- **Action functions** (`click*`, `open*`, `expand*`, `type*`, `visit*`): perform one user action, no assertions about outcomes
- **Verify functions** (`verify*`): assert state only, no user actions
- Functions used only within the page object: no `export`
- Functions used by test files: `export`
- General functions (3+ page files): put in `main.page.js`
- Page-specific functions: put in that page's `.pages.js`
- Prefer parameterized general functions over one function per element

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
  space.verifySafeDashboardUrlSafeQuery('sep:0x1234...')
  space.verifySafeNameInSafeLevelNavigation('My Safe')
})
```

### Rules

- **Test names**: always `'Verify that [expected behavior]'`
- **No raw Cypress commands in test files**: every `cy.get()`, `cy.url().should()`, `cy.contains().click()` must be in a page object function
- **No hardcoded selectors in test files**: import from page objects
- **No `cy.wait(N)` hard waits**: use assertion-based waits (`cy.get(sel, { timeout: 30000 }).should('be.visible')`)
- **No `.only`**: never commit `it.only` or `describe.only`
- **Test data in fixtures**: put static data in `cypress/fixtures/`, not inline in tests. Use `staticSpaces`, `getSafes(CATEGORIES.static)`, etc.
- **Separate actions from assertions**: blank line between action block and assertion block
- **Reuse `main.verifyElementsCount`** for counting elements instead of inline `.should('have.length', N)`

### Test Data

- Safe addresses: `getSafes(CATEGORIES.static)` — never hardcode
- Static space data: `cypress/fixtures/spaces/staticSpaces.js`
- localStorage: payloads in `support/localstorage_data.js`, keys in `support/constants.js`
- API mocks: `cy.intercept()` + `cy.fixture()` from `fixtures/`

## Phase 4: Cleanup Checklist

After writing or refactoring tests, verify:

- [ ] No raw selectors in test files — all in page objects
- [ ] No unused `export` keywords — only export what test files import
- [ ] No dead exports — remove functions/consts not used anywhere
- [ ] Internal-only selectors and helpers are `const`/`function` (not `export`)
- [ ] No `cy.wait(N)` hard waits
- [ ] No `.only` left in tests
- [ ] No commented-out code left behind
- [ ] All `data-testid` attributes added to source components are actually referenced in Cypress page objects
- [ ] Test names follow "Verify that" format
- [ ] Parameterized functions used instead of duplicated per-element functions
