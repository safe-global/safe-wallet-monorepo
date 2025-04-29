import { useIsTWAPFallbackHandler } from '@/features/swap/hooks/useIsTWAPFallbackHandler'
import { renderHook } from '@/tests/test-utils'
import * as useSafeInfo from '@/hooks/useSafeInfo'
import type { ExtendedSafeInfo } from '@safe-global/store/slices/SafeInfo/types'
import { TWAP_FALLBACK_HANDLER, TWAP_FALLBACK_HANDLER_NETWORKS } from '../../helpers/utils'

describe('useIsTWAPFallbackHandler', () => {
  const mockSafeAddress = '0x0000000000000000000000000000000000005AFE'
  const mockSafeInfo = {
    safe: {
      chainId: TWAP_FALLBACK_HANDLER_NETWORKS[0],
      fallbackHandler: { value: TWAP_FALLBACK_HANDLER },
    } as ExtendedSafeInfo,
    safeAddress: mockSafeAddress,
    safeLoaded: true,
    safeError: undefined,
    safeLoading: true,
  }

  const useSafeInfoSpy = jest.spyOn(useSafeInfo, 'default')

  beforeEach(() => {
    useSafeInfoSpy.mockReturnValue(mockSafeInfo)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('should return `true`', () => {
    it('if the Safe has the TWAP fallback handler set', () => {
      const { result } = renderHook(() => useIsTWAPFallbackHandler())

      expect(result.current).toBe(true)
    })

    it('if the TWAP fallback handler address is passed', () => {
      const { result } = renderHook(() => useIsTWAPFallbackHandler(TWAP_FALLBACK_HANDLER))

      expect(result.current).toBe(true)
    })
  })

  describe('should return `false`', () => {
    describe('if the Safe`s chain is not supported for TWAP', () => {
      beforeEach(() => {
        useSafeInfoSpy.mockReturnValue({ ...mockSafeInfo, safe: { ...mockSafeInfo.safe, chainId: '123' } })
      })

      it('and the Safe has the TWAP fallback handler set for the', () => {
        const { result } = renderHook(() => useIsTWAPFallbackHandler())

        expect(result.current).toBe(false)
      })

      it('and the TWAP fallback handler address is passed', () => {
        const { result } = renderHook(() => useIsTWAPFallbackHandler(TWAP_FALLBACK_HANDLER))

        expect(result.current).toBe(false)
      })
    })

    it('if the Safe does not have the TWAP fallback handler set', () => {
      useSafeInfoSpy.mockReturnValue({
        ...mockSafeInfo,
        safe: { ...mockSafeInfo.safe, fallbackHandler: { value: '0x123' } },
      })

      const { result } = renderHook(() => useIsTWAPFallbackHandler())

      expect(result.current).toBe(false)
    })

    it('if the TWAP fallback handler address is not passed', () => {
      const { result } = renderHook(() => useIsTWAPFallbackHandler('0x123'))

      expect(result.current).toBe(false)
    })

    it('if the Safe info is not loaded', () => {
      useSafeInfoSpy.mockReturnValue({ ...mockSafeInfo, safe: {} as ExtendedSafeInfo, safeLoaded: false })

      const { result } = renderHook(() => useIsTWAPFallbackHandler())

      expect(result.current).toBe(false)
    })
  })
})
