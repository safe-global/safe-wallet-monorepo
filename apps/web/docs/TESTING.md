# Testing Conventions (Web App)

Testing guide for the `apps/web/` workspace. Follow these conventions to write consistent, reliable tests.

## When to write a test

- Every new hook, utility function, or service
- Every Redux slice (reducers + selectors)
- Components with conditional rendering, user interaction, or non-trivial logic
- Bug fixes (write a regression test that fails without the fix)

### Test decision matrix

| What you changed             | Required tests                 | Test type                                      | Example                                                            |
| ---------------------------- | ------------------------------ | ---------------------------------------------- | ------------------------------------------------------------------ |
| New hook (`use*.ts`)         | Unit test with `renderHook`    | `hooks/__tests__/useX.test.ts`                 | Mock dependencies, test return values and state changes            |
| New utility/service (`*.ts`) | Unit test                      | `utils.test.ts` colocated                      | Pure function tests, edge cases, error paths                       |
| New component with logic     | Unit test + Storybook story    | `Component.test.tsx` + `Component.stories.tsx` | Render with providers, test interactions, story for visual states  |
| New component (layout only)  | Storybook story only           | `Component.stories.tsx`                        | No unit test needed — story covers visual correctness              |
| Redux slice                  | State transition test          | `mySlice.test.ts`                              | Test reducers by dispatching actions and asserting resulting state |
| RTK Query endpoint           | MSW integration test           | `api.test.ts`                                  | Use MSW to mock API, test cache behavior                           |
| Bug fix (any file)           | Regression test                | Add to existing test file                      | Write a test that fails without the fix, passes with it            |
| Feature (new feature dir)    | All of the above as applicable | Per-file rules above                           | Plus: add feature flag test showing disabled state                 |

## When NOT to test

- Pure layout components with zero logic (just JSX composition)
- Type-only files, barrel re-exports, constants-only files
- Storybook stories (they have their own snapshot workflow)
- Auto-generated files (`AUTO_GENERATED/`, contract types)

## Choose the test level

Write each test at the lowest level that can show the behaviour. **A Playwright test is only for behaviour that needs a real browser or several real services together**: a user action that a wallet signs, the chain executes, and the Transaction Service and CGW then show; a Safe App in an iframe; WalletConnect; a session or storage across a redirect or a reload. Everything else goes in Jest.

| The behaviour                                     | Test                                         | Example                                                                                                                                          |
| ------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| A rule or a calculation                           | Unit test                                    | [UntrustedFallbackHandlerTxAlert.test.ts](../src/components/tx/confirmation-views/SettingsChange/UntrustedFallbackHandlerTxAlert.test.ts)        |
| A component shows a CGW response                  | Component test with an MSW fixture           | [ExpandableTransactionItem.swaps.fixtures.test.tsx](../src/components/transactions/TxListItem/ExpandableTransactionItem.swaps.fixtures.test.tsx) |
| A component reacts to the user                    | Component test                               | [TxShareLink.test.tsx](../src/components/transactions/TxShareLink/TxShareLink.test.tsx)                                                          |
| A user action changes state on chain and in CGW   | Playwright journey on the isolated stack     | [multisig-confirm.spec.ts](../e2e/tests/e2e/multisig-confirm.spec.ts)                                                                            |
| A browser flow has paths the stack cannot produce | Playwright with `page.route` for those paths | [step-up-auth.spec.ts](../e2e/tests/regression/step-up-auth.spec.ts)                                                                             |

Mock in Playwright only when the flow needs the browser (a redirect, a session, a reload) and the isolated stack cannot produce the path: an error, an expired session, a third-party answer. When the browser adds nothing to a spec that mocks every call, write the test in Jest.

A Playwright test does not make up for missing unit and component tests: if a feature lacks them, add them. Developers own the Jest tests. QA owns the Playwright suite and advises on it, and developers add and change Playwright tests too. Full agreement: [Developer Testability Contract](../e2e/docs/developer-testability-contract.md).

## Running tests

```bash
# Run all tests
yarn workspace @safe-global/web test

# Run a specific test file
yarn workspace @safe-global/web test -- --testPathPatterns=src/features/earn/services/utils

# Watch mode
yarn workspace @safe-global/web test -- --watch --testPathPatterns=src/features/earn

# Coverage report
yarn workspace @safe-global/web test:coverage
```

## File location

Colocate test files with the source they test:

```
src/features/earn/
  hooks/
    useEarnData.ts
    __tests__/
      useEarnData.test.ts     # hook test
  services/
    utils.ts
    utils.test.ts             # utility test (colocated)
  components/
    EarnCard/
      EarnCard.tsx
      EarnCard.test.tsx        # component test
```

Both patterns (colocated `*.test.ts` and `__tests__/` subdirectory) are acceptable.

## Import rules

Always import `render`, `renderHook`, and `screen` from our custom test utils, NOT from `@testing-library/react` directly:

```typescript
// CORRECT
import { render, screen, waitFor, renderHook } from '@/tests/test-utils'
import { renderWithUserEvent, fakerChecksummedAddress } from '@/tests/test-utils'

// WRONG - bypasses providers (Redux, Router, Theme)
import { render } from '@testing-library/react'
```

## Test data

- Use builders from `@/tests/builders/` for typed test data with sensible defaults
- Use `faker` from `@faker-js/faker` for randomized data
- Use `fakerChecksummedAddress()` from `@/tests/test-utils` for Ethereum addresses
- Override only the fields relevant to your test via `.with()`

```typescript
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'

const safe = extendedSafeInfoBuilder().with({ threshold: 2, deployed: true }).build()
```

Available builders:

- `@/tests/builders/safe` — `safeInfoBuilder`, `extendedSafeInfoBuilder`, `addressExBuilder`
- `@/tests/builders/chains` — `chainBuilder`
- `@/tests/builders/wallet` — `connectedWalletBuilder`
- `@/tests/builders/safeTx` — Safe transaction builders
- `@/tests/builders/balances` — `tokenInfoBuilder`, `balanceBuilder`, `balancesBuilder`
- `@/tests/builders/transactionDetails` — `transactionDetailsBuilder`, `multisigExecutionDetailsBuilder`
- `@/tests/builders/collectibles` — `collectibleBuilder`
- `@/tests/builders/hypernativeAuthStatus` — `hypernativeAuthStatusBuilder`

## Mock conventions

### Setup pattern

Use `jest.mock()` at file top level, then `jest.requireMock()` to get typed mock references. Use `@/tests/mocks/hooks` helpers in `beforeEach` for common mocks.

```typescript
// Top of file: declare mocks
jest.mock('@/hooks/useSafeInfo')
jest.mock('@/hooks/useChainId')
jest.mock('@/hooks/useChains')

// Get typed mock references
const mockUseSafeInfo = jest.requireMock('@/hooks/useSafeInfo').default as jest.Mock
const mockUseChainId = jest.requireMock('@/hooks/useChainId').default as jest.Mock

// Or use centralized helpers
import { mockSafeInfo, mockChainId } from '@/tests/mocks/hooks'

beforeEach(() => {
  jest.clearAllMocks()
  mockSafeInfo({ deployed: true, threshold: 2 })
  mockChainId('1')
})
```

### Top-6 most-mocked modules

#### 1. `@/hooks/useSafeInfo`

```typescript
jest.mock('@/hooks/useSafeInfo')
const mockUseSafeInfo = jest.requireMock('@/hooks/useSafeInfo').default as jest.Mock
mockUseSafeInfo.mockReturnValue({
  safe: extendedSafeInfoBuilder().with({ threshold: 2 }).build(),
  safeAddress: '0x1234...',
  safeLoaded: true,
  safeLoading: false,
})
```

#### 2. `@/hooks/useChainId`

```typescript
jest.mock('@/hooks/useChainId')
const mockUseChainId = jest.requireMock('@/hooks/useChainId').default as jest.Mock
mockUseChainId.mockReturnValue('1')
```

#### 3. `@/hooks/useChains` (useCurrentChain, useHasFeature)

```typescript
jest.mock('@/hooks/useChains')
const mockUseCurrentChain = jest.requireMock('@/hooks/useChains').useCurrentChain as jest.Mock
const mockUseHasFeature = jest.requireMock('@/hooks/useChains').useHasFeature as jest.Mock
mockUseCurrentChain.mockReturnValue(chainBuilder().with({ chainId: '1' }).build())
mockUseHasFeature.mockReturnValue(true)
```

#### 4. `@/hooks/wallets/useWallet`

```typescript
jest.mock('@/hooks/wallets/useWallet')
const mockUseWallet = jest.requireMock('@/hooks/wallets/useWallet').default as jest.Mock
mockUseWallet.mockReturnValue(connectedWalletBuilder().build())
```

#### 5. `@/hooks/useIsSafeOwner`

```typescript
jest.mock('@/hooks/useIsSafeOwner')
const mockUseIsSafeOwner = jest.requireMock('@/hooks/useIsSafeOwner').default as jest.Mock
mockUseIsSafeOwner.mockReturnValue(true)
```

#### 6. `@/services/analytics`

```typescript
jest.mock('@/services/analytics')
```

No return value needed — this just prevents analytics side effects.

### `window.location`

jsdom makes `window.location` non-configurable, so `Object.defineProperty(window, 'location', …)` throws. Instead:

- **Set the path/query:** `window.history.replaceState(null, '', '/spaces?spaceId=1')`
- **Set the origin:** a `/** @jest-environment-options {"url": "https://app.safe.global/"} */` docblock at the top of the file
- **Assert a redirect or reload:** production code calls `navigateTo` / `reloadPage` from `@/utils/navigation`; tests `jest.mock('@/utils/navigation')` and assert on those
- **SSR (`typeof window === 'undefined'`):** a separate `*.ssr.test.ts` file with a `/** @jest-environment node */` docblock

### Time and timers

Every test runs on a fake clock (`fakeTimers` in `jest.config.cjs`). It starts at the same instant, `FAKE_CLOCK_START` in `jest.clock.cjs` (2026-01-15 10:30 UTC), and advances with real time, so `waitFor`, `findBy*` and `userEvent` work without setup.

- **Set a date:** `jest.setSystemTime(...)`. Seed dates relative to the fixed start, not to today.
- **Move time:** `jest.advanceTimersByTime(ms)` inside `act`, or `advanceClock(ms)` from `@/tests/test-utils`.
- **On the default clock, do not assert at an exact boundary** such as `delay - 1` when an `await` sits between the steps: real time also moves the clock by a few milliseconds. Check at half the delay, then after it, or wait with `findBy*` / `waitFor`.
- **For exact timing, give every test in the file a strict clock:** `beforeEach(() => jest.useFakeTimers({ advanceTimers: false }))`. Without the option, `jest.useFakeTimers()` takes `advanceTimers: true` from the config.
- **Do not switch clocks for a single test**, and do not call `jest.useRealTimers()` in a file whose other tests use the default clock. React and libraries keep the clock they saw first, and their timers stop firing.
- **Each test starts clean:** `jest.setup.js` sets the clock back to the start and clears pending timers before every test, so `setSystemTime` and advances do not carry over.

## Templates

### Utility / service test

For pure functions with no React dependencies.

```typescript
import { myUtil } from '../utils'

describe('myUtil', () => {
  it('should handle normal input', () => {
    expect(myUtil('input')).toBe('expected')
  })

  it('should handle edge case', () => {
    expect(myUtil('')).toBe('default')
  })

  it('should throw on invalid input', () => {
    expect(() => myUtil(null as never)).toThrow('Invalid input')
  })
})
```

### Hook test

Use `renderHook` from `@/tests/test-utils` (wraps with Redux + Router + Theme providers).

```typescript
import { renderHook, waitFor } from '@/tests/test-utils'
import { useMyHook } from '../useMyHook'

jest.mock('@/hooks/useSafeInfo')
jest.mock('@/hooks/useChainId')

const mockUseSafeInfo = jest.requireMock('@/hooks/useSafeInfo').default as jest.Mock
const mockUseChainId = jest.requireMock('@/hooks/useChainId').default as jest.Mock

describe('useMyHook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSafeInfo.mockReturnValue({
      safe: { threshold: 2, owners: [{ value: '0x1' }] },
      safeAddress: '0x1234',
      safeLoaded: true,
      safeLoading: false,
    })
    mockUseChainId.mockReturnValue('1')
  })

  it('should return expected value', () => {
    const { result } = renderHook(() => useMyHook())
    expect(result.current).toBe('expected')
  })

  it('should update when dependency changes', async () => {
    const { result, rerender } = renderHook(() => useMyHook())
    mockUseChainId.mockReturnValue('137')
    rerender()
    await waitFor(() => {
      expect(result.current).toBe('updated')
    })
  })
})
```

### Component test

Use `render` or `renderWithUserEvent` from `@/tests/test-utils`.

```typescript
import { screen } from '@testing-library/react'
import { render, renderWithUserEvent } from '@/tests/test-utils'
import { MyComponent } from './MyComponent'

jest.mock('@/hooks/useSafeInfo')
jest.mock('@/hooks/useChains')

const mockUseSafeInfo = jest.requireMock('@/hooks/useSafeInfo').default as jest.Mock
const mockUseCurrentChain = jest.requireMock('@/hooks/useChains').useCurrentChain as jest.Mock

describe('MyComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSafeInfo.mockReturnValue({
      safe: { threshold: 1, owners: [{ value: '0x1' }] },
      safeAddress: '0xSafe',
      safeLoaded: true,
      safeLoading: false,
    })
    mockUseCurrentChain.mockReturnValue({ chainId: '1', chainName: 'Ethereum' })
  })

  it('should render the component', () => {
    render(<MyComponent />)
    expect(screen.getByText('Expected text')).toBeInTheDocument()
  })

  it('should not render when condition is false', () => {
    mockUseSafeInfo.mockReturnValue({
      safe: { threshold: 1 },
      safeLoaded: false,
      safeLoading: true,
    })
    const { container } = render(<MyComponent />)
    expect(container.firstChild).toBeNull()
  })

  it('should handle user interaction', async () => {
    const { user } = renderWithUserEvent(<MyComponent />)
    await user.click(screen.getByRole('button', { name: 'Submit' }))
    expect(screen.getByText('Submitted')).toBeInTheDocument()
  })
})
```

### Redux slice test

Test reducers by calling `slice.reducer(state, action)` and asserting the resulting state.

```typescript
import { mySlice, myAction, selectMyData } from '../mySlice'

describe('mySlice', () => {
  describe('myAction', () => {
    it('should update state', () => {
      const initialState = { items: [] }
      const state = mySlice.reducer(initialState, myAction({ item: 'new' }))
      expect(state.items).toEqual(['new'])
    })

    it('should handle empty state', () => {
      const state = mySlice.reducer(undefined, myAction({ item: 'first' }))
      expect(state.items).toEqual(['first'])
    })
  })

  describe('selectMyData', () => {
    it('should select data from state', () => {
      const mockState = {
        [mySlice.name]: { items: ['a', 'b'] },
      }
      expect(selectMyData(mockState as never)).toEqual(['a', 'b'])
    })
  })
})
```
