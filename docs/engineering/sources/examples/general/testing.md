# Testing

Use these examples when adding tests for conditional rendering, copied UI
flows, hydration, skip branches, or negative assertions.

## negative-assertions

Use this when asserting that UI is hidden.

Prefer:

```ts
expect(screen.queryByTestId('add-safe-to-workspace-button')).not.toBeInTheDocument()
expect(screen.queryByText('Add Safe to space')).not.toBeInTheDocument()
```

Avoid:

```ts
expect(screen.queryByText('Add Safe to workspace')).not.toBeInTheDocument()
```

Why:

The avoided assertion targets stale copy. It passes even if the current button
renders with the new text.

## branch-specific-tests

Use this when adding a new skip, hydration, merge-priority, or permission
branch.

Prefer:

```ts
it('skips the request without safe address or known chains', () => {
  renderHook(() => useSafeKnownChainsOverview({ safeAddress: undefined }))

  expect(useSafeOverviewQuery).toHaveBeenCalledWith(expect.anything(), {
    skip: true,
  })
})
```

Avoid:

```ts
it('renders without crashing', () => {
  renderHook(() => useSafeKnownChainsOverview())
})
```

Why:

New branch logic needs a test that fails if the branch is removed.

## unambiguous-e2e-selectors

Use this when Cypress needs to click a specific control and nearby controls
share similar copy.

Prefer:

```ts
cy.findByRole('button', { name: /^Continue with wallet / }).click()
```

Also acceptable:

```ts
cy.get('[data-testid="wallet-sign-in-button"]').click()
```

Avoid:

```ts
cy.contains('Continue with').click()
```

Why:

Auth and transaction flows often render multiple controls with similar labels.
Broad text selectors can click the first matching button and exercise the wrong
path.

## conversion-vs-orchestration

Use this when a component or initializer calls a pure conversion helper.

Prefer:

```ts
it('converts CGW chains to Reown networks', () => {
  expect(cgwChainsToReownNetworks(chains)).toEqual(expectedNetworks)
})

it('passes converted networks to AppKit', () => {
  render(<AppKitInitializer />)

  expect(createAppKitInstance).toHaveBeenCalledWith(
    expect.objectContaining({ networks: expectedNetworks }),
  )
})
```

Avoid:

```ts
it('converts networks', () => {
  render(<AppKitInitializer />)

  expect(cgwChainsToReownNetworks).toHaveBeenCalledWith(chains)
})
```

Why:

The caller test proves orchestration. The helper test proves the conversion
output.

## E2E-01 — Match formatted-value regex to actual rendered output

Source: PR #7533 (RL-20260331-004)

### Avoid

```ts
export function verifyFiatValueVisible() {
  cy.contains(/\$ [\d,]+(\.\d+)?/).should('be.visible')
}
```

### Prefer

```ts
export function verifyFiatValueVisible() {
  // FiatValue inserts a thin Unicode space ( ) after the currency symbol,
  // so the regex must accept any whitespace between symbol and digits.
  cy.contains(/\$\s[\d,]+(\.\d+)?/).should('be.visible')
}
```

### Why

The avoided regex demands an ASCII space after `$`, but the rendered formatter
emits a thin Unicode space. The assertion fails on values that are visually
correct, so the helper produces false negatives whenever it is used.

## TEST-01 — Assert the specific behavior the description claims

Source: PR #7533 (RL-20260331-005)

### Avoid

```ts
// TC #340
it('Verify that "Total positions value" displays the correct sum of all protocol fiat values', () => {
  portfolio.visitAndSettle(constants.positionsUrl + staticSafes.MATIC_STATIC_SAFE_33)
  portfolio.verifyTotalPositionsTitleVisible()
  portfolio.verifyFiatValueVisible()
})
```

### Prefer

```ts
it('Verify that "Total positions value" displays the correct sum of all protocol fiat values', () => {
  portfolio.visitAndSettle(constants.positionsUrl + staticSafes.MATIC_STATIC_SAFE_33)
  portfolio.verifyTotalPositionsTitleVisible()

  const expectedTotal = portfolio.sumProtocolRowFiatValues()
  portfolio.verifyTotalPositionsValue(expectedTotal)
})
```

### Why

The avoided test is named after a computed total but only checks that some fiat
value is visible. A regression in the sum that still leaves individual rows
populated will pass silently. Tests must assert the specific behavior named in
the description.

## TEST-01 — Mock external lookups instead of relying on real fixture state

Source: PR #7589 (RL-20260408-002)

### Avoid

```ts
it('should trust recommendedMasterCopyVersion when chain is not in safe-deployments', () => {
  expect(
    getLatestSafeVersion(chainBuilder().with({ chainId: '25363', recommendedMasterCopyVersion: '1.4.1' }).build()),
  ).toEqual('1.4.1')
})
```

### Prefer

```ts
it('should trust recommendedMasterCopyVersion when chain is not in safe-deployments', () => {
  const spy = jest.spyOn(safeDeployments, 'getSafeSingletonDeployment').mockReturnValueOnce(undefined)

  expect(
    getLatestSafeVersion(chainBuilder().with({ chainId: '99999', recommendedMasterCopyVersion: '1.4.1' }).build()),
  ).toEqual('1.4.1')

  spy.mockRestore()
})

it('falls back when chain is missing and recommendedMasterCopyVersion is null', () => {
  jest.spyOn(safeDeployments, 'getSafeSingletonDeployment').mockReturnValueOnce(undefined)

  expect(
    getLatestSafeVersion(chainBuilder().with({ chainId: '99999', recommendedMasterCopyVersion: null }).build()),
  ).toEqual(LATEST_SAFE_VERSION)
})
```

### Why

The avoided test depends on a third-party package not knowing about a specific
chainId. The moment that package adds the chain, the test stops exercising the
fallback branch and silently becomes meaningless. Mock the lookup so the branch
is hit deterministically, and add a sibling test for the explicit-null variant
to lock in current behavior.

## TEST-01 — Test the debounce, not just the post-debounce assertion

Source: PR #7455 (RL-20260318-002)

### Avoid

```ts
// After debounce settles, should still be undefined (no ENS for ADDRESS2)
await waitFor(() => {
  expect(result.current.ens).toBeUndefined()
})
```

### Prefer

```ts
jest.useFakeTimers()
rerender({ address: ADDR_WITHOUT_ENS })
// Stale-guard returns undefined immediately while debounce is pending
expect(result.current.ens).toBeUndefined()
// Advance past the debounce, then assert the lookup happened for the NEW address
act(() => {
  jest.advanceTimersByTime(200)
})
expect(lookupAddress).toHaveBeenCalledWith(ADDR_WITHOUT_ENS)
await waitFor(() => expect(result.current.ens).toBeUndefined())
```

### Why

An assertion that holds on render zero never exercises the debounced behavior, so a regression in the staleness guard slips through. Advance fake timers and assert the new lookup ran so the test fails when the guard is removed.

## Overwriting localStorage fixtures must include implicit app-seeded entries

Source: PR (RL-20260217-001)

### Avoid

```ts
// support/localstorage_data.js
export const sidebarTrustedSafe1Safe2 = {
  11155111: {
    '0xBb26...80aEB': { owners: [], threshold: 1, ethBalance: '0' },
    // missing the visited safe SEP_STATIC_SAFE_9 that autoTrustSafeFromUrl
    // would otherwise add — addToAppLocalStorage overwrites the whole key.
  },
}
```

### Prefer

```ts
export const sidebarTrustedSafe1Safe2 = {
  11155111: {
    '0x9870...5fec0': { owners: [], threshold: 1, ethBalance: '0' }, // visited safe
    '0xBb26...80aEB': { owners: [], threshold: 1, ethBalance: '0' },
  },
}
```

### Why

If the helper writes the whole key (not a merge), any state the app would populate on visit is lost on reload. Every fixture must explicitly carry those entries, or the assertions silently regress against a banner state.

## Cypress retry timeout belongs on the preceding command

Source: PR (RL-20260218-001)

### Avoid

```ts
cy.window().invoke('localStorage.getItem', key).should('equal', '{}', { timeout: 10000 }) // treated as assertion message, not timeout
```

### Prefer

```ts
cy.window({ timeout: 10000 }).invoke('localStorage.getItem', key).should('equal', '{}')
```

### Why

Cypress retries the chained command using the preceding command's timeout. The third argument of .should() is parsed as the failure message, so the intended retry budget silently degrades to the suite default.

## Match real gateway response shapes when intercepting

Source: PR (RL-20260220-003)

### Avoid

```ts
// constants.js
export const chainConfigEndpoint = '**/v1/chains/*' // never matches the paginated /v1/chains call

// page object
cy.intercept('GET', constants.chainConfigEndpoint, (req) => {
  req.continue((res) => {
    if (res.body?.features) res.body.features.push(featureName) // top-level features doesn't exist
  })
})
```

### Prefer

```ts
export const chainsListEndpoint = '**/v1/chains?**'

cy.intercept('GET', constants.chainsListEndpoint, (req) => {
  req.continue((res) => {
    res.body.results = res.body.results?.map((chain) => ({
      ...chain,
      features: chain.features.includes(featureName) ? chain.features : [...chain.features, featureName],
    }))
  })
})
```

### Why

If the URL pattern doesn't match the real call, or the mutated path doesn't exist on the response, the interceptor is a silent no-op and the test still depends on live backend state — the very thing the mock is supposed to remove.

## Builders vs MSW fixtures

Source: PR #7416 (RL-20260313-002)

### Avoid

```ts
// unit test for a token decimals helper
import { efSafe } from 'config/test/msw/fixtures/balances'

it('handles 6-decimal tokens', () => {
  const usdc = efSafe.balances.find((b) => b.tokenInfo.symbol === 'USDC')!
  expect(formatAmount(usdc)).toBe('1,234.56')
})
```

### Prefer

```ts
import { erc20TokenBuilder } from '@/tests/builders/balances'

it('handles 6-decimal tokens', () => {
  const usdc = erc20TokenBuilder().with({ decimals: 6, balance: '1234560000' }).build()
  expect(formatAmount(usdc)).toBe('1,234.56')
})
```

### Why

MSW fixtures are scenario-shaped real responses tied to specific Safes. They are not minimal test cases, they hide which field the assertion actually depends on, and they deterministically encode values that should be free in a unit test.

## DATA-04 — Read E2E test data and hosts from shared sources

Source: PR #9075, #9065 (RL-20261014-001)

### Avoid

```ts
const SEPOLIA = '11155111'
const CONTACT = { name: 'Treasury contact', address: '0x1111111111111111111111111111111111111111' }

await page.waitForURL((url) => url.hostname === 'localhost' && !url.pathname.startsWith('/cgw'))
```

### Prefer

```ts
import { CHAIN_IDS, TEST_ADDRESSES } from '../../src/data/constants'

const SEPOLIA = CHAIN_IDS.sepolia
const CONTACT = { name: 'Treasury contact', address: TEST_ADDRESSES.NON_OWNER }

const { baseURL } = test.info().project.use
if (!baseURL) throw new Error('signInWithEmail needs the baseURL of the wallet')
await page.waitForURL((url) => url.origin === new URL(baseURL).origin)
```

### Why

A change to the shared test data reaches every spec only when the specs import it. A run whose wallet URL points at `127.0.0.1` or another port never matches a hardcoded `localhost`, so the wait times out before the test checks anything; the configured `baseURL` is the one source of the wallet's origin.

## TEST-01 — Click links without asserting their href

Source: PR #9003 (RL-20261012-001)

### Avoid

```js
const appLink = () => cy.get(`a[aria-label="Open ${app}"]`).first()
appLink().should('have.attr', 'href').and('match', linkWithSafe)
appLink().click()
```

### Prefer

```js
cy.get(`a[aria-label="Open ${app}"]`).first().click()
```

### Why

The `href` check makes every spec that uses the helper depend on how the link encodes its target, so a valid move to client-side navigation fails them while clicking still opens the right app. The spec checks the app that opens. The `href` was only checked to wait for the router; the product now reads the Safe from the URL until the router is ready.

## TEST-04 — Extend CI path filters when tests or stories move

Source: PR #8988 (RL-20261009-002)

### Avoid

```yaml
# Storybook now also loads packages/<new-package>/src/**/*.stories.tsx,
# but the workflow that snapshots the stories still triggers only on the app
on:
  pull_request:
    paths:
      - apps/web/**
```

### Prefer

```yaml
on:
  pull_request:
    paths:
      - apps/web/**
      - packages/<new-package>/**
```

### Why

A PR that changes only the moved files no longer triggers the run, so their tests or stories lose coverage without any failure. Every discovery glob that scans the old path (changed-story scripts, screenshot steps) needs the new location too.

## TEST-04 — Let the mocked child act on the props it receives

Source: PR #9224, #9283, #9118 (RL-20261022-001)

### Avoid

```tsx
// Replaces the deleted Cypress sidebar checks
jest.mock('../BatchTxList', () => ({ __esModule: true, default: () => null }))
```

### Prefer

```tsx
jest.mock('../BatchTxList', () => ({
  __esModule: true,
  default({ txItems, onDelete }: { txItems: DraftBatchItem[]; onDelete: (id: string) => void }) {
    return txItems.map((item) => (
      <button key={item.id} onClick={() => onDelete(item.id)}>
        Delete {item.id}
      </button>
    ))
  },
}))
```

### Why

A child mocked as `null` lets the parent stop passing the list or the delete handler and every test still passes. The mock renders what it receives and calls back, so a test can click delete and assert the parent's handler ran with the right id.

## TEST-01 — Check a value is complete before testing containment

Source: PR #9094 (RL-20261022-006)

### Avoid

```ts
expect(appHash).toContain(deviceTransactionHash(review).toLowerCase())
```

### Prefer

```ts
const deviceHash = deviceTransactionHash(review).toLowerCase()
expect(deviceHash).toMatch(/^0x[0-9a-f]{64}$/)
expect(appHash).toContain(deviceHash)
```

### Why

Every string contains `''`, so when the device shows no hash the first assertion passes without comparing anything. Asserting the full 32-byte shape first makes the comparison mean what the test claims.

## TEST-07 — Clear persisted state a story's named state depends on

Source: PR #9132 (RL-20261020-002)

### Avoid

```tsx
export const Disclaimer: Story = {
  parameters: createMockStory({ scenario: 'efSafe', pathname: '/earn', features: { earn: true } }).parameters,
}
```

### Prefer

```tsx
export const Disclaimer: Story = {
  parameters: createMockStory({ scenario: 'efSafe', pathname: '/earn', features: { earn: true } }).parameters,
  beforeEach: () => localItem(EARN_CONSENT_STORAGE_KEY).remove(),
}
```

### Why

The page reads consent from local storage, so once someone clicks Continue in Storybook the story renders the page instead of the disclaimer, and the visual run compares the wrong state.

## TEST-04 — Test each link the replaced E2E check crossed

Source: PR #9409 (RL-20261023-001)

### Avoid

```ts
jest.mock('../../TxFlow', () => ({ TxFlow: jest.fn(() => null) }))
expect(txFlowProps()).toMatchObject({ txNonce, isRejection: true, isBatchable: false })
// TxFlow → TxFlowProvider → context is never exercised
```

### Prefer

```tsx
it('passes isBatchable to the flow context', () => {
  const { result } = renderHook(() => useContext(TxFlowContext), {
    wrapper: ({ children }) => (
      <TxFlowProvider step={0} data={{}} isBatchable={false}>
        {children}
      </TxFlowProvider>
    ),
  })
  expect(result.current.isBatchable).toBe(false)
})
```

### Why

The deleted browser test ran the whole chain from the flow to the slot. Testing only the two ends lets a dropped prop in the middle bring the bug back with every test green; one test per link catches it.

## TEST-04 — Keep the deleted test's format check

Source: PR #9402 (RL-20261027-001)

### Avoid

```ts
expect(getFieldValue(details, 'Net annual rewards')).toHaveTextContent('ETH')
```

### Prefer

```ts
const REWARD = /^\d+(\.\d+)? ETH \(\$\s?\d{1,3}(,\d{3})*\)$/

expect(getFieldValue(details, 'Net annual rewards').textContent).toMatch(REWARD)
```

### Why

The deleted Cypress test checked the amount and the fiat value. A cell that renders only the symbol still contains `ETH`, so the weaker check passes when both values disappear.

## TEST-01 — Flush async work before a positive assertion

Source: PR #9426 (RL-20261026-002)

### Avoid

```ts
await waitFor(() => expect(mockIsSmartContractWallet).toHaveBeenCalled())
await waitFor(() => {
  expect(result.current).toContain('execute')
})
```

### Prefer

```ts
await waitFor(() => expect(mockIsSmartContractWallet).toHaveBeenCalled())
await act(async () => {})
expect(result.current).toContain('execute')
```

### Why

The pre-check default already registers Execute, so a positive `waitFor` passes on the first render, before the async result it is meant to test arrives. Flushing first makes the assertion read the settled state.

## E2E-01 — Query inside the visible cell, not the whole row

Source: PR #9396 (RL-20261028-002)

### Avoid

```tsx
expect(within(rowOf(name)!).queryAllByTestId('swap-btn').length).toBeGreaterThan(0)
```

### Prefer

```tsx
const actionsCell = within(rowOf(name)!).getByTestId('table-cell-actions')
expect(within(actionsCell).getByTestId('swap-btn')).toBeInTheDocument()
```

### Why

Each row also renders a mobile copy of the buttons that CSS hides on desktop. Counting over the whole row passes on that hidden copy when the visible button is gone.

## TEST-05 — Derived test addresses stay valid

Source: PR #9173 (RL-20261028-004)

### Avoid

```ts
export const fakerLookalikeAddress = (address: string) =>
  `0x${address.slice(2, 6)}${faker.string.hexadecimal({ length: 32, prefix: '', casing: 'lower' })}${address.slice(-4)}`
```

### Prefer

```ts
export const fakerLookalikeAddress = (address: string) =>
  checksumAddress(
    `0x${address.slice(2, 6)}${faker.string.hexadecimal({ length: 32, prefix: '', casing: 'lower' })}${address.slice(-4)}`.toLowerCase(),
  )
```

### Why

Mixed-case ends with a lowercase middle fail the EIP-55 checksum in most runs, so a test that types the value into a validated address field fails at random.
