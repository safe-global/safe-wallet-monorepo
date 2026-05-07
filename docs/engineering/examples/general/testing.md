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
