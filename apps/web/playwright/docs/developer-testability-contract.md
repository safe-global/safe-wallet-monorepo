# Developer Testability Contract

**Audience**: Developers working on safe-wallet-monorepo.

**Purpose**: This is what QA automation needs from your code to write stable, maintainable tests. These are not suggestions — they are the contract between development and QA.

---

## 1. Semantic HTML First

Use semantic HTML elements (`button`, `input`, `select`, `heading`, `dialog`, `alert`) wherever possible. Playwright locates elements via ARIA roles — semantic HTML gives us stable selectors for free.

```tsx
// ✅ Testable — Playwright finds this with getByRole('button', { name: 'Send' })
<button onClick={handleSend}>Send</button>

// ❌ Hard to test — requires data-testid or fragile CSS selector
<div className="btn-primary" onClick={handleSend}>Send</div>
```

## 2. Add `data-testid` When Roles Aren't Enough

When semantic HTML doesn't provide a unique locator (e.g., multiple similar elements, dynamic lists, complex composite components), add `data-testid`:

```tsx
<div data-testid="pending-tx-widget">
  {transactions.map((tx) => (
    <div key={tx.id} data-testid={`tx-row-${tx.id}`}>
      ...
    </div>
  ))}
</div>
```

Rules for `data-testid`:

- Use descriptive, stable names: `data-testid="owner-list-item"` not `data-testid="div-3"`
- Never tie them to implementation: `data-testid="send-button"` not `data-testid="mui-btn-42"`
- Don't remove them without checking with QA — they may be used in automation

## 3. Accessible Labels on Form Fields

Every input, select, and textarea needs an accessible label. This is both an a11y requirement and a testability requirement.

```tsx
// ✅ Testable — Playwright finds this with getByLabel('Recipient address')
<label htmlFor="recipient">Recipient address</label>
<input id="recipient" />

// ❌ Not testable by label
<input placeholder="Enter address" />
```

## 4. Expose Loading and Error States

QA automation needs to know when the page is ready. If a component has loading, empty, or error states, make them distinguishable:

```tsx
// ✅ Testable — QA can wait for loading to finish, then assert content
{
  isLoading && <Skeleton data-testid="balance-skeleton" />
}
{
  error && <Alert severity="error">Failed to load balances</Alert>
}
{
  data && <BalanceList items={data.items} />
}

// ❌ Not testable — no signal that loading finished or failed
{
  data ? <BalanceList items={data.items} /> : null
}
```

## 5. Stable URLs and Routes

Every testable page should have a stable, bookmarkable URL. Tests navigate directly to URLs — they don't click through menus.

```
✅ /home?safe=sep:0x1234...  → stable, parameterized
✅ /balances?safe=sep:0x1234... → stable, parameterized
❌ /page/3?tab=2&view=grid    → fragile, position-dependent
```

## 6. Feature Flags Must Be Overridable

If a feature is behind a flag, QA needs a way to enable/disable it in tests without touching the production flag system. Options:

- localStorage override: `localStorage.setItem('FEATURE_X', 'true')`
- URL parameter: `?feature_x=true`
- Environment variable: `NEXT_PUBLIC_FEATURE_X=true`

Document the override mechanism when creating the flag. If there's no test override, QA can't automate the feature.

## 7. API Endpoints for Test Setup

If a feature creates or mutates state (transactions, settings, address book entries), QA needs an API path to set up and verify that state without clicking through the UI.

What QA needs:

- **Read endpoints** — to verify preconditions before test and outcomes after
- **Predictable response shapes** — so API tests can validate contracts

What QA does NOT need from you:

- Write/mutation endpoints for test setup (we use the Safe Client Gateway staging API)
- Test-only API routes (we work with what exists)

## 8. Don't Break Existing Selectors

Before refactoring a component's DOM structure:

- Search for `data-testid` attributes on the elements you're changing
- Search for the component's visible text strings in `playwright/tests/` and `cypress/e2e/`
- If you find matches, coordinate with QA or update the test locators in the same PR

Broken selectors = broken CI = blocked merges.

## 9. Test Pyramid Ownership

This is the most important section. Playwright E2E tests are the **top** of the pyramid, not the foundation.

| Test level              | Owner          | What it covers                                              |
| ----------------------- | -------------- | ----------------------------------------------------------- |
| **Unit tests**          | Developer      | Pure functions, parsers, validators, formatters, hooks      |
| **Component tests**     | Developer      | React components render correctly with props, handle events |
| **Integration tests**   | Developer      | Hooks + stores + API mocks wired together                   |
| **API tests**           | QA + Developer | Backend returns correct data                                |
| **Playwright UI tests** | QA             | Critical user flows that require a real browser             |

**If your PR changes business logic, it should include unit/component tests.** QA will not write Playwright tests to compensate for missing lower-level coverage. If we find a gap, we'll flag it back to you — that's not a QA failure, it's the process working correctly.

---

## Quick Checklist for Every PR

Before marking a PR as "Ready for QA":

- [ ] Interactive elements use semantic HTML or have `data-testid`
- [ ] Form fields have accessible labels
- [ ] Loading/error/empty states are visually distinguishable
- [ ] Feature has a stable URL for direct navigation
- [ ] Feature flags have a documented test override
- [ ] Unit and component tests cover the business logic
- [ ] No existing `data-testid` attributes were removed without replacement
