# Testing Conventions (Web App)

Testing guide for the `apps/web/` workspace. Follow these conventions to write consistent, reliable tests.

## When to write a test

- Every new hook, utility function, or service
- Every Redux slice (reducers + selectors)
- Components with conditional rendering, user interaction, or non-trivial logic
- Bug fixes (write a regression test that fails without the fix)

## When NOT to test

- Pure layout components with zero logic (just JSX composition)
- Type-only files, barrel re-exports, constants-only files
- Storybook stories (they have their own snapshot workflow)
- Auto-generated files (`AUTO_GENERATED/`, contract types)

## Running tests

```bash
# Run all tests
yarn workspace @safe-global/web test

# Run a specific test file
yarn workspace @safe-global/web test -- --testPathPattern=src/features/earn/services/utils

# Watch mode
yarn workspace @safe-global/web test -- --watch --testPathPattern=src/features/earn

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

const safe = extendedSafeInfoBuilder()
  .with({ threshold: 2, deployed: true })
  .build()
```

Available builders:
- `@/tests/builders/safe` — `safeInfoBuilder`, `extendedSafeInfoBuilder`, `addressExBuilder`
- `@/tests/builders/chains` — `chainBuilder`
- `@/tests/builders/wallet` — `connectedWalletBuilder`
- `@/tests/builders/safeTx` — Safe transaction builders
- `@/tests/builders/balances` — `tokenInfoBuilder`, `balanceBuilder`, `balancesBuilder`
- `@/tests/builders/transactionDetails` — `transactionDetailsBuilder`, `multisigExecutionDetailsBuilder`
- `@/tests/builders/collectibles` — `collectibleBuilder`

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
      const state = mySlice.reducer(
        initialState,
        myAction({ item: 'new' }),
      )
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
