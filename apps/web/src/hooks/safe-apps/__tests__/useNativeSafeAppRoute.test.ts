import { FEATURES } from '@safe-global/utils/utils/chains'
import { AppRoutes } from '@/config/routes'
import { chainBuilder } from '@/tests/builders/chains'
import { renderHook } from '@/tests/test-utils'
import { useNativeSafeAppRoute } from '@/hooks/safe-apps/useNativeSafeAppRoute'
import * as useChains from '@/hooks/useChains'

describe('useNativeSafeAppRoute', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('returns the native route when the current chain enables it', () => {
    jest.spyOn(useChains, 'useCurrentChain').mockReturnValue(
      chainBuilder()
        .with({ features: [FEATURES.SAFE_APPS_NATIVE_REDIRECT, FEATURES.NATIVE_SWAPS] })
        .build(),
    )

    const { result } = renderHook(() => useNativeSafeAppRoute('https://swap.cow.fi'))

    expect(result.current).toBe(AppRoutes.swap)
  })

  it('returns undefined when the chain is not loaded', () => {
    jest.spyOn(useChains, 'useCurrentChain').mockReturnValue(undefined)

    const { result } = renderHook(() => useNativeSafeAppRoute('https://swap.cow.fi'))

    expect(result.current).toBeUndefined()
  })

  it('returns undefined for apps without a native equivalent', () => {
    jest.spyOn(useChains, 'useCurrentChain').mockReturnValue(
      chainBuilder()
        .with({ features: [FEATURES.SAFE_APPS_NATIVE_REDIRECT, FEATURES.NATIVE_SWAPS, FEATURES.BRIDGE] })
        .build(),
    )

    const { result } = renderHook(() => useNativeSafeAppRoute('https://app.uniswap.org'))

    expect(result.current).toBeUndefined()
  })
})
