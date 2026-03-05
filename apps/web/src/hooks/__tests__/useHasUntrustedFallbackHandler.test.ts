import { renderHook } from '@/tests/test-utils'
import { useHasUntrustedFallbackHandler } from '../useHasUntrustedFallbackHandler'
import { useTWAPFallbackHandlerAddress } from '@/features/swap'
import useSafeInfo from '@/hooks/useSafeInfo'
import { faker } from '@faker-js/faker'
import { getCompatibilityFallbackHandlerDeployment } from '@safe-global/safe-deployments'
import { safeInfoBuilder } from '@/tests/builders/safe'

// TWAP_FALLBACK_HANDLER constant - imported directly from helpers to avoid circular deps in tests
const TWAP_FALLBACK_HANDLER = '0x2c2b9c9a4a25e24b174f26114e8926a9f2128fe4'

jest.mock('@/hooks/useCompatibilityFallbackHandlerDeployments')
jest.mock('@/hooks/useSafeInfo')
jest.mock('@/features/swap', () => ({
  useTWAPFallbackHandlerAddress: jest.fn(),
  TWAP_FALLBACK_HANDLER: '0x2c2b9c9a4a25e24b174f26114e8926a9f2128fe4',
}))

const fallbackHandlerAddress = getCompatibilityFallbackHandlerDeployment({
  network: '1',
  version: '1.4.1',
})?.defaultAddress!

describe('useHasUntrustedFallbackHandler', () => {
  beforeEach(() => {
    ;(useSafeInfo as jest.Mock).mockReturnValue({ safe: safeInfoBuilder().with({ chainId: '1' }).build() })
    ;(useTWAPFallbackHandlerAddress as jest.Mock).mockReturnValue(TWAP_FALLBACK_HANDLER)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('should return `false`', () => {
    it('if current Safe`s fallback handler is an official one', () => {
      ;(useSafeInfo as jest.Mock).mockReturnValue({
        safe: safeInfoBuilder()
          .with({ fallbackHandler: { value: fallbackHandlerAddress } })
          .build(),
      })
      const { result } = renderHook(() => useHasUntrustedFallbackHandler())

      expect(result.current).toBe(false)
    })

    it('if the provided fallback handler is an official one', () => {
      const { result } = renderHook(() => useHasUntrustedFallbackHandler(fallbackHandlerAddress))

      expect(result.current).toBe(false)
    })

    it('if the provided fallback handler is the TWAPFallbackHandler', () => {
      const { result } = renderHook(() => useHasUntrustedFallbackHandler(TWAP_FALLBACK_HANDLER))

      expect(result.current).toBe(false)
    })

    it('if all provided fallback handler addresses are trusted', () => {
      const { result } = renderHook(() =>
        useHasUntrustedFallbackHandler([fallbackHandlerAddress, TWAP_FALLBACK_HANDLER]),
      )

      expect(result.current).toBe(false)
    })

    it('if there is no fallback handler address', () => {
      ;(useSafeInfo as jest.Mock).mockReturnValue({ safe: { fallbackHandler: { value: undefined }, chainId: '1' } })

      const { result } = renderHook(() => useHasUntrustedFallbackHandler())

      expect(result.current).toBe(false)
    })
  })

  describe('should return `true`', () => {
    it('if the current Safe`s fallback handler is not an official one', () => {
      ;(useSafeInfo as jest.Mock).mockReturnValue({
        safe: { fallbackHandler: { value: faker.finance.ethereumAddress() }, chainId: '1' },
      })

      const { result } = renderHook(() => useHasUntrustedFallbackHandler())

      expect(result.current).toBe(true)
    })

    it('if the TWAPFallbackHandler is undefined', () => {
      ;(useTWAPFallbackHandlerAddress as jest.Mock).mockReturnValue(undefined)

      const { result } = renderHook(() => useHasUntrustedFallbackHandler(TWAP_FALLBACK_HANDLER))

      expect(result.current).toBe(true)
    })

    it('if the provided fallback handler is not an official one', () => {
      const { result } = renderHook(() => useHasUntrustedFallbackHandler(faker.finance.ethereumAddress()))

      expect(result.current).toBe(true)
    })

    it('if any provided fallback handler addresses is untrusted', () => {
      ;(useSafeInfo as jest.Mock).mockReturnValue({
        safe: safeInfoBuilder()
          .with({ fallbackHandler: { value: fallbackHandlerAddress } })
          .build(),
      })
      const { result } = renderHook(() =>
        useHasUntrustedFallbackHandler([
          faker.finance.ethereumAddress(),
          fallbackHandlerAddress,
          TWAP_FALLBACK_HANDLER,
        ]),
      )

      expect(result.current).toBe(true)
    })
  })
})
