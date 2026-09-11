import { renderHook } from '@/tests/test-utils'
import { useHasUntrustedFallbackHandler } from '../useHasUntrustedFallbackHandler'
import { useTWAPFallbackHandlerAddress } from '@/features/swap'
import useSafeInfo from '@/hooks/useSafeInfo'
import { faker } from '@faker-js/faker'
import {
  getCompatibilityFallbackHandlerDeployment,
  getExtensibleFallbackHandlerDeployment,
} from '@safe-global/safe-deployments'
import { safeInfoBuilder } from '@/tests/builders/safe'
// Imported directly from helpers to avoid circular deps in tests
import { TWAP_FALLBACK_HANDLER } from '@/features/swap/helpers/utils'

jest.mock('@/hooks/useSafeInfo')
jest.mock('@/features/swap', () => ({
  useTWAPFallbackHandlerAddress: jest.fn(),
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

    it('if the provided fallback handler is the official 1.5.0 one', () => {
      const fallbackHandler150Address = getCompatibilityFallbackHandlerDeployment({
        network: '1',
        version: '1.5.0',
      })?.defaultAddress!

      const { result } = renderHook(() => useHasUntrustedFallbackHandler(fallbackHandler150Address))

      expect(result.current).toBe(false)
    })

    it('if the provided fallback handler is the official ExtensibleFallbackHandler', () => {
      const extensibleFallbackHandlerAddress = getExtensibleFallbackHandlerDeployment({
        network: '1',
        version: '1.5.0',
      })?.defaultAddress!

      const { result } = renderHook(() => useHasUntrustedFallbackHandler(extensibleFallbackHandlerAddress))

      expect(result.current).toBe(false)
    })

    it('if the current Safe`s fallback handler is the official ExtensibleFallbackHandler', () => {
      const extensibleFallbackHandlerAddress = getExtensibleFallbackHandlerDeployment({
        network: '1',
        version: '1.5.0',
      })?.defaultAddress!
      ;(useSafeInfo as jest.Mock).mockReturnValue({
        safe: safeInfoBuilder()
          .with({ fallbackHandler: { value: extensibleFallbackHandlerAddress } })
          .build(),
      })
      const { result } = renderHook(() => useHasUntrustedFallbackHandler())

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
