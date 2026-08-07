import { renderHook } from '@testing-library/react'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { DEFAULT_CHAIN_ID } from '@/config/constants'
import { useChain } from '@/hooks/useChains'
import { useIsSurveyEnabled } from '@/hooks/useIsSurveyEnabled'

// Mock the whole `@/hooks/useChains` module rather than using jest.spyOn —
// spy-based mocks break React's hook-ordering invariants when the consumer
// also calls useSyncExternalStore (the same reason the sibling
let mockChainData: Chain | undefined
jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  useChain: jest.fn(() => mockChainData),
  default: jest.fn(() => ({ configs: [], loading: false })),
  useCurrentChain: jest.fn(() => undefined),
}))

const mockedUseChain = useChain as jest.MockedFunction<typeof useChain>

const setMockChain = (chain: Chain | undefined) => {
  mockChainData = chain
}

const mockChain = (features: FEATURES[]): Chain =>
  ({ chainId: String(DEFAULT_CHAIN_ID), features: features as unknown as string[] }) as Chain

describe('useIsSurveyEnabled', () => {
  beforeEach(() => {
    setMockChain(undefined)
  })

  it('returns undefined while the chains config has not loaded', () => {
    setMockChain(undefined)

    const { result } = renderHook(() => useIsSurveyEnabled())

    expect(result.current).toBeUndefined()
  })

  it('returns false when the default chain does NOT have SPACE_ONBOARDING_SURVEY (survey OFF)', () => {
    setMockChain(mockChain([]))

    const { result } = renderHook(() => useIsSurveyEnabled())

    expect(result.current).toBe(false)
  })

  it('returns true when the default chain has SPACE_ONBOARDING_SURVEY (survey ON)', () => {
    setMockChain(mockChain([FEATURES.SPACE_ONBOARDING_SURVEY]))

    const { result } = renderHook(() => useIsSurveyEnabled())

    expect(result.current).toBe(true)
  })

  it('reads the flag from the default chain (not the current chain)', () => {
    // The survey runs during Space onboarding before any chain is selected,
    // so the hook must look up the default chain regardless of which chain
    // the rest of the app is on.
    setMockChain(mockChain([]))
    mockedUseChain.mockClear()

    renderHook(() => useIsSurveyEnabled())

    expect(mockedUseChain).toHaveBeenCalledWith(String(DEFAULT_CHAIN_ID))
  })
})
