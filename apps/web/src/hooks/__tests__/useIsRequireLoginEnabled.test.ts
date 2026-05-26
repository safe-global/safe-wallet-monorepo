import { renderHook } from '@testing-library/react'
import { useChain } from '@/hooks/useChains'
import { useIsRequireLoginEnabled } from '@/hooks/useIsRequireLoginEnabled'
import { disableClassicView, enableClassicView } from '@/hooks/useClassicView'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { DEFAULT_CHAIN_ID } from '@/config/constants'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

const mockIsTestE2E = jest.fn(() => false)
jest.mock('@/config/constants', () => {
  const actual = jest.requireActual('@/config/constants')
  return {
    ...actual,
    get IS_TEST_E2E() {
      return mockIsTestE2E()
    },
  }
})

// See useClassicView.test.ts for why we mock the whole module rather than
// using jest.spyOn — spy-based mocks break React's hook-ordering invariants
// when the consumer also calls useSyncExternalStore.
let mockChainData: Chain | undefined
jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  useChain: jest.fn(() => mockChainData),
  default: jest.fn(() => ({ configs: [], loading: false })),
  useCurrentChain: jest.fn(() => undefined),
}))

let mockIsSignedIn = false
jest.mock('@/store', () => ({
  __esModule: true,
  useAppSelector: jest.fn(() => mockIsSignedIn),
}))

const mockedUseChain = useChain as jest.MockedFunction<typeof useChain>

const setMockChain = (chain: Chain | undefined) => {
  mockChainData = chain
}

const mockChain = (features: FEATURES[]): Chain =>
  ({ chainId: String(DEFAULT_CHAIN_ID), features: features as unknown as string[] }) as Chain

describe('useIsRequireLoginEnabled', () => {
  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
    setMockChain(undefined)
    mockIsSignedIn = false
  })

  afterEach(() => {
    disableClassicView()
  })

  it('returns true when the default chain does NOT have REQUIRE_LOGIN_DISABLED (gate ON)', () => {
    setMockChain(mockChain([]))

    const { result } = renderHook(() => useIsRequireLoginEnabled())

    expect(result.current).toBe(true)
  })

  it('returns false when the default chain has REQUIRE_LOGIN_DISABLED (gate OFF)', () => {
    setMockChain(mockChain([FEATURES.REQUIRE_LOGIN_DISABLED]))

    const { result } = renderHook(() => useIsRequireLoginEnabled())

    expect(result.current).toBe(false)
  })

  it('returns undefined while the chains config has not loaded', () => {
    setMockChain(undefined)

    const { result } = renderHook(() => useIsRequireLoginEnabled())

    expect(result.current).toBeUndefined()
  })

  it('reads the flag from the default chain (not the current chain)', () => {
    setMockChain(mockChain([]))
    mockedUseChain.mockClear()

    renderHook(() => useIsRequireLoginEnabled())

    expect(mockedUseChain).toHaveBeenCalledWith(String(DEFAULT_CHAIN_ID))
  })

  it('forces the gate OFF under Cypress (IS_TEST_E2E)', () => {
    // Even if the chain config would normally produce gate ON, Cypress runs bypass it.
    setMockChain(mockChain([]))
    mockIsTestE2E.mockReturnValue(true)

    const { result } = renderHook(() => useIsRequireLoginEnabled())

    expect(result.current).toBe(false)

    mockIsTestE2E.mockReturnValue(false)
  })

  it('returns false when the user has opted into classic view this session', () => {
    setMockChain(mockChain([]))
    enableClassicView()

    const { result } = renderHook(() => useIsRequireLoginEnabled())

    expect(result.current).toBe(false)
  })

  it('honours the classic-view opt-in even while chains config is still loading', () => {
    // Without the opt-in this returns undefined (see test above) — opt-in
    // short-circuits to false so the gate doesn't briefly flicker on after
    // the user has explicitly bypassed it.
    setMockChain(undefined)
    enableClassicView()

    const { result } = renderHook(() => useIsRequireLoginEnabled())

    expect(result.current).toBe(false)
  })

  it('re-engages the gate when an opted-in user signs in, so the post-login flow takes over', () => {
    // Otherwise the "signed in but no Spaces → onboarding" redirect would
    // never trigger for an opted-in user who later signs in within the same
    // tab — the override is signed-out-only.
    setMockChain(mockChain([]))
    enableClassicView()
    mockIsSignedIn = true

    const { result } = renderHook(() => useIsRequireLoginEnabled())

    expect(result.current).toBe(true)
  })

  it('returns undefined on the very first render so the classic-view opt-in (from useSyncExternalStore) has time to settle before consumers act', () => {
    // useIsClassicViewOptedIn is backed by useSyncExternalStore, which returns
    // its `false` server snapshot during hydration. If useIsRequireLoginEnabled
    // returned `true` (gate ON) on that first render, the route guard would
    // fire a redirect to /welcome/spaces before the real opt-in propagated.
    // We instead return undefined until the first effect tick, which the
    // guard treats as "still loading".
    setMockChain(mockChain([]))
    enableClassicView()

    const captures: Array<boolean | undefined> = []
    renderHook(() => {
      const value = useIsRequireLoginEnabled()
      captures.push(value)
      return value
    })

    expect(captures[0]).toBeUndefined()
    expect(captures[captures.length - 1]).toBe(false)
  })
})
