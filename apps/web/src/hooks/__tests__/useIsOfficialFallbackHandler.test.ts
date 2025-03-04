import { renderHook } from '@/tests/test-utils'
import { useIsOfficialFallbackHandler } from '../useIsOfficialFallbackHandler'
import { useCompatibilityFallbackHandlerDeployments } from '@/hooks/useCompatibilityFallbackHandlerDeployments'
import useSafeInfo from '@/hooks/useSafeInfo'

jest.mock('@/hooks/useCompatibilityFallbackHandlerDeployments')
jest.mock('@/hooks/useSafeInfo')

describe('useIsOfficialFallbackHandler', () => {
  const mockSafeInfo = { safe: { fallbackHandler: { value: '0x123' }, chainId: '1' } }
  const mockDeployments = {
    networkAddresses: {
      '1': ['0x123', '0x456'],
    },
  }

  beforeEach(() => {
    ;(useSafeInfo as jest.Mock).mockReturnValue(mockSafeInfo)
    ;(useCompatibilityFallbackHandlerDeployments as jest.Mock).mockReturnValue(mockDeployments)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('should return `true`', () => {
    it('if current Safe`s fallback handler is an official one', () => {
      const { result } = renderHook(() => useIsOfficialFallbackHandler())

      expect(result.current).toBe(true)
    })

    it('if the provided fallback handler is an official one', () => {
      const { result } = renderHook(() => useIsOfficialFallbackHandler('0x456'))

      expect(result.current).toBe(true)
    })
  })

  describe('should return `false`', () => {
    it('if the current Safe`s fallback handler is not an official one', () => {
      ;(useSafeInfo as jest.Mock).mockReturnValue({ safe: { fallbackHandler: { value: '0x789' }, chainId: '1' } })

      const { result } = renderHook(() => useIsOfficialFallbackHandler())

      expect(result.current).toBe(false)
    })

    it('if the provided fallback handler is not an official one', () => {
      const { result } = renderHook(() => useIsOfficialFallbackHandler('0x789'))

      expect(result.current).toBe(false)
    })

    it('if there is no fallback handler address', () => {
      ;(useSafeInfo as jest.Mock).mockReturnValue({ safe: { fallbackHandler: { value: undefined }, chainId: '1' } })

      const { result } = renderHook(() => useIsOfficialFallbackHandler())

      expect(result.current).toBe(false)
    })

    it('if there are no fallback handler deployments', () => {
      ;(useCompatibilityFallbackHandlerDeployments as jest.Mock).mockReturnValue(undefined)

      const { result } = renderHook(() => useIsOfficialFallbackHandler())

      expect(result.current).toBe(false)
    })
  })
})
