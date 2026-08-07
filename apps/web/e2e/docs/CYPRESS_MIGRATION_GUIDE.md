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

When migrating a Cypress test, document:

1. **Original file**: `cypress/e2e/smoke/dashboard.cy.js`
2. **Classification**: Critical UI flow → Playwright smoke
3. **New file**: `e2e/tests/smoke/dashboard.spec.ts`
4. **What changed**: Setup moved to API, 3 assertions removed (covered by unit tests), locators upgraded to getByRole
5. **Cypress file status**: Ready for deletion / Still needed for X

This tracking enables the eventual Cypress removal — we need to know when every valuable test has a Playwright equivalent.
