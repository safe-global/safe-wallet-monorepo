# AI Test Output Format — Mandatory Protocol

**When**: Before writing any Playwright test — whether from a ticket, Cypress migration, test idea, PR, or feature request.

**Who must follow**: Any AI agent (Claude, Copilot, Cursor, custom skills), any human writing automation.

**Hard rule**: Code is step 11 of 12. If you jump to code first, you are doing it wrong.

---

## The 12-Step Output

### 1. Test Purpose

One sentence a PM could read. What exactly are we verifying?

> Example: "Verify that the dashboard shows the correct token balances for a Safe on Sepolia."

### 2. Risk Covered

What breaks for users if this test doesn't exist? If the answer is "nothing meaningful," say so and recommend not automating.

> Example: "Users could see stale or zero balances after a token transfer, leading to panic or duplicate sends."

### 3. Recommended Test Level

Pick one. Justify it.

| Level                | When to pick                                                               |
| -------------------- | -------------------------------------------------------------------------- |
| Unit                 | Pure function, parser, validator, formatter                                |
| Component            | React component renders correctly with props                               |
| Integration          | Hook + store + API mock wired together                                     |
| API                  | Backend returns correct data (no browser needed)                           |
| Playwright UI        | Real browser needed — user flow, visual state, cross-component interaction |
| Manual / Exploratory | Too complex to automate reliably, or one-time verification                 |
| Don't automate       | Unclear requirements, unstable feature, low risk                           |

### 4. Why This Belongs in Playwright (or Not)

Explicit justification. "Because it's a user flow" is not enough. What specifically requires a real browser?

> Good: "The balance page fetches data from CGW, renders a token list with formatting, and the user scans it visually — this can only be verified in a browser."
>
> Bad: "It's a UI feature so it needs a UI test." → Challenge this. Can the logic be tested at unit/API level instead?

### 5. Required Test Data

AI must answer these 4 questions for every test:

1. **What data does this test need?** — which Safes, tokens, addresses, chain IDs, or fixtures?
2. **How is the data created?** — existing static Safes, API setup, factory/builder, or manual?
3. **How is the data cleaned?** — read-only (no cleanup), API reversal, or dedicated test Safe?
4. **Can this test run in parallel?** — does it mutate shared state? If yes, it needs its own data.

Rules:

- Use existing static test Safes from `src/data/constants.ts` for read-only tests
- If new test data is needed, document what must be created and where
- Never hardcode addresses that aren't in the shared constants file
- Use unique identifiers for created data (e.g., include `testInfo.testId` or `Date.now()`)
- Use API for data creation and cleanup when possible — never UI clicks
- Avoid dependency on existing shared mutable data — create what you need, clean what you create

### 6. Setup Strategy

How do we get the app into the right state before assertions?

- **Preferred**: API call to verify preconditions exist (Safe has balance, tx is queued)
- **Acceptable**: localStorage seeding via fixture, direct URL navigation
- **Avoid**: UI clicks to set up state (slow, flaky, tests the setup not the feature)

**Network mocking (`page.route()`) — when and when not:**

- **Default: test against real staging API.** This is a core framework principle.
- **Mock only for states you can't create via real API**: error responses (500, 404, timeout), slow responses (test loading spinners), malformed data (test defensive rendering)
- **Never mock to make a test faster** — that hides real issues
- **Pattern**: use `page.route()` with `route.fulfill()` to return custom responses, not `route.abort()`

```typescript
// ✅ Acceptable — testing error state that can't be created via real API
await page.route('**/v1/chains/*/safes/**', (route) =>
  route.fulfill({ status: 500, body: JSON.stringify({ message: 'Internal error' }) }),
)

// ❌ Never — mocking happy path to avoid real API
await page.route('**/v1/chains/*/safes/**', (route) =>
  route.fulfill({ status: 200, body: JSON.stringify(fakeSafeInfo) }),
)
```

### 7. Cleanup Strategy

How do we leave the environment clean after the test?

- **Preferred**: Tests are read-only (verify state, don't mutate it)
- **If mutation is required**: Document what needs reversal and whether API cleanup is possible
- **Hard rule**: Never rely on test execution order for cleanup
- **Parallel safety**: Tests run in parallel in CI. No shared mutable data, no fixed user/object unless read-only, use dedicated Safes for tests that mutate state. See `README.md → Parallel Execution Rule` for the full 6-rule checklist.

### 8. Locator Strategy

For each key element the test interacts with, specify the locator approach:

1. `getByRole()` — most accessible, most stable
2. `getByLabel()` — for form fields
3. `getByText()` — for visible text
4. `getByTestId()` — last resort (coupled to implementation)

If a needed `data-testid` is missing, flag it in step 10 (testability gaps) — don't silently use a CSS selector.

### 9. Flakiness Risks

What could make this test flaky in CI? Address each one:

- Network-dependent data → mock or use API precondition check
- Animation/transition timing → use web-first assertions that auto-retry
- Race conditions → wait for specific element state, not arbitrary timeouts
- Dynamic content (timestamps, balances) → assert pattern/range, not exact value

**Hard rule**: `page.waitForTimeout()` is never acceptable. **Waiting for time is not waiting for readiness.**

AI must use one of these approved alternatives instead:

1. **Locator assertions** — `await expect(locator).toBeVisible()` / `.toHaveText()` / `.toBeEnabled()`
2. **Response waiting** — `await page.waitForResponse(url => url.includes('/api/...'))`
3. **URL assertions** — `await expect(page).toHaveURL(/\/expected-path/)`
4. **State assertions** — `await expect(locator).toHaveAttribute('aria-selected', 'true')`
5. **API polling** — `await safeApiClient.waitForCondition(...)` when no UI signal exists
6. **App-specific stable signals** — wait for spinner/skeleton to disappear, or a known data element to render

If AI generates `page.waitForTimeout()`, it must provide a strong justification AND propose the better alternative that should replace it.

### 10. Testability Gaps for Developers

What's missing in the codebase that makes this test harder than it should be?

- Missing `data-testid` on interactive elements
- No API endpoint for test setup/teardown
- Ambiguous requirements (what is the expected behavior?)
- Component doesn't expose state for verification
- Feature behind a flag with no test override

Format these as actionable developer feedback, not complaints.

### 11. Final Code

Only after steps 1–10 are reviewed and approved.

Rules for the code:

- Import from `src/fixtures/test.fixture` (never raw `@playwright/test`)
- Thin Page Object for locators + actions; assertions stay in the test
- No hard waits, no CSS selectors, no XPath

**Test naming convention — pattern: `should [expected behavior] when [condition]`**

The test name must be readable in a CI failure notification. If you can't understand what broke from the name alone, it's too vague.

```typescript
// ✅ Good — readable in a CI alert, describes behavior and context
test('should show ETH balance on dashboard after API confirms funds')
test('should display error alert when CGW returns 500')
test('should disable Send button when wallet is not connected')

// ❌ Bad — meaningless in a failure report
test('balances test')
test('it works')
test('test 1')
```

**File placement — tag must match directory:**

| If the test is...                                    | Directory           | Tag           |
| ---------------------------------------------------- | ------------------- | ------------- |
| Critical user journey (user calls support if broken) | `tests/smoke/`      | `@smoke`      |
| Pure API validation (no browser needed)              | `tests/api/`        | `@api`        |
| Full multi-step user flow (may need wallet)          | `tests/e2e/`        | `@e2e`        |
| Bug-specific regression (proves a fix works)         | `tests/regression/` | `@regression` |

A `@smoke` test lives in `tests/smoke/`, never in `tests/regression/`. If you're unsure, default to `tests/regression/` — promotion to `tests/smoke/` is a deliberate decision after the test proves stable.

**Assertion rules — AI must follow all four:**

1. **Assert visible user behavior** — what the user sees, not internal state
2. **Assert important state changes** — meaningful transitions, not every intermediate step
3. **Do not over-assert implementation details** — test WHAT, not HOW
4. **Do not duplicate API business logic in UI assertions** — if the API test validates data correctness, the UI test only checks that data renders

Use web-first assertions only. Never extract text manually and assert on the raw value:

```typescript
// ✅ Good — web-first, auto-retrying, role-based
await expect(page.getByRole('alert')).toContainText('Email is required')
await expect(page.getByRole('button', { name: 'Save' })).toBeDisabled()
await expect(page.getByRole('heading', { name: user.name })).toBeVisible()

// ❌ Avoid — non-retrying, implementation-coupled
expect(await locator.textContent()).toBe('Saved')
```

### 12. What Still Needs Human Review

What can't the AI verify on its own?

- Is the test data still valid? (Safe still has tokens, contract not paused)
- Does the assertion match the actual product requirement or just current behavior?
- Is there a manual edge case this test doesn't cover?
- Should this test be part of smoke (every PR) or regression (on-demand)?

---

## Anti-Patterns — Never Do These

| Anti-pattern                     | Why it's wrong                           | Do this instead                          |
| -------------------------------- | ---------------------------------------- | ---------------------------------------- |
| Line-by-line Cypress translation | Different framework, different paradigm  | Rethink from scratch using this protocol |
| Jump straight to code            | Builds the wrong test at the wrong level | Complete steps 1–10 first                |
| Default to Playwright UI         | Most things should be tested below UI    | Justify why a browser is needed          |
| Hardcode test addresses          | Breaks when test infra changes           | Use `src/data/constants.ts`              |
| `page.waitForTimeout(3000)`      | Arbitrary, flaky, slow                   | Web-first assertions auto-retry          |
| Assertions inside Page Objects   | Hides what the test actually checks      | Keep assertions visible in test file     |
| Automate unclear requirements    | Test encodes assumptions, not truth      | Flag as testability gap, ask PM          |
