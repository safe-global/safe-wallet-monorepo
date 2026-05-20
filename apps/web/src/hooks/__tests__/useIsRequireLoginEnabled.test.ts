import { renderHook } from '@testing-library/react'
import * as useChainsModule from '@/hooks/useChains'
import { useIsRequireLoginEnabled } from '@/hooks/useIsRequireLoginEnabled'
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

const mockChain = (features: FEATURES[]): Chain =>
  ({ chainId: String(DEFAULT_CHAIN_ID), features: features as unknown as string[] }) as Chain

describe('useIsRequireLoginEnabled', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('returns true when the default chain does NOT have REQUIRE_LOGIN_DISABLED (gate ON)', () => {
    jest.spyOn(useChainsModule, 'useChain').mockReturnValue(mockChain([]))

    const { result } = renderHook(() => useIsRequireLoginEnabled())

    expect(result.current).toBe(true)
  })

  it('returns false when the default chain has REQUIRE_LOGIN_DISABLED (gate OFF)', () => {
    jest.spyOn(useChainsModule, 'useChain').mockReturnValue(mockChain([FEATURES.REQUIRE_LOGIN_DISABLED]))

    const { result } = renderHook(() => useIsRequireLoginEnabled())

    expect(result.current).toBe(false)
  })

  it('returns undefined while the chains config has not loaded', () => {
    jest.spyOn(useChainsModule, 'useChain').mockReturnValue(undefined)

    const { result } = renderHook(() => useIsRequireLoginEnabled())

    expect(result.current).toBeUndefined()
  })

  it('reads the flag from the default chain (not the current chain)', () => {
    const useChainSpy = jest.spyOn(useChainsModule, 'useChain').mockReturnValue(mockChain([]))

    renderHook(() => useIsRequireLoginEnabled())

    expect(useChainSpy).toHaveBeenCalledWith(String(DEFAULT_CHAIN_ID))
  })

  it('forces the gate OFF under Cypress (IS_TEST_E2E)', () => {
    // Even if the chain config would normally produce gate ON, Cypress runs bypass it.
    jest.spyOn(useChainsModule, 'useChain').mockReturnValue(mockChain([]))
    mockIsTestE2E.mockReturnValue(true)

    const { result } = renderHook(() => useIsRequireLoginEnabled())

    expect(result.current).toBe(false)

    mockIsTestE2E.mockReturnValue(false)
  })
})
