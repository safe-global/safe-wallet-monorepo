import { renderHook } from '@/tests/test-utils'
import { FEATURES } from '@safe-global/utils/utils/chains'
import * as useChainsModule from '@/hooks/useChains'
import { chainBuilder } from '@/tests/builders/chains'
import { useDefaultFallbackPolicy } from '../useDefaultFallbackPolicy'

const ALLOW_POLICY = '0x92e94Af03982C2486dffa8DcBc5d069D33996eF2'

const mockChain = (chainId: string, features: FEATURES[]) =>
  jest.spyOn(useChainsModule, 'useChain').mockReturnValue(
    chainBuilder()
      .with({ chainId, features: features as never })
      .build(),
  )

describe('useDefaultFallbackPolicy', () => {
  afterEach(() => jest.restoreAllMocks())

  it('returns the AllowPolicy while the chain enables the default fallback', () => {
    mockChain('11155111', [FEATURES.POLICY_DEFAULT_ALLOW_FALLBACK])

    const { result } = renderHook(() => useDefaultFallbackPolicy('11155111'))

    expect(result.current).toBe(ALLOW_POLICY)
  })

  it('returns nothing while the flag is off', () => {
    mockChain('11155111', [])

    const { result } = renderHook(() => useDefaultFallbackPolicy('11155111'))

    expect(result.current).toBeUndefined()
  })

  it('returns nothing on a chain without a policy engine', () => {
    mockChain('10', [FEATURES.POLICY_DEFAULT_ALLOW_FALLBACK])

    const { result } = renderHook(() => useDefaultFallbackPolicy('10'))

    expect(result.current).toBeUndefined()
  })
})
