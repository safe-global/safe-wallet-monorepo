import { renderHook } from '@/tests/test-utils'
import { getCompatibilityFallbackHandlerDeployments } from '@safe-global/safe-deployments'
import { useCompatibilityFallbackHandlerDeployments } from '../useCompatibilityFallbackHandlerDeployments'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useCurrentChain } from '@/hooks/useChains'

jest.mock('@safe-global/safe-deployments')
jest.mock('@/hooks/useSafeInfo')
jest.mock('@/hooks/useChains')

describe('useCompatibilityFallbackHandlerDeployments', () => {
  const mockSafeInfo = { safe: { version: '1.0.0' } }
  const mockChain = { chainId: '1' }

  beforeEach(() => {
    ;(useSafeInfo as jest.Mock).mockReturnValue(mockSafeInfo)
    ;(useCurrentChain as jest.Mock).mockReturnValue(mockChain)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return `undefined` if chain is not set', () => {
    ;(useCurrentChain as jest.Mock).mockReturnValue(undefined)

    const { result } = renderHook(() => useCompatibilityFallbackHandlerDeployments())

    expect(result.current).toBeUndefined()
    expect(getCompatibilityFallbackHandlerDeployments).not.toHaveBeenCalled()
  })

  it('should return `undefined` if safe version is not set', () => {
    ;(useSafeInfo as jest.Mock).mockReturnValue({ safe: { version: undefined } })

    const { result } = renderHook(() => useCompatibilityFallbackHandlerDeployments())

    expect(result.current).toBeUndefined()
    expect(getCompatibilityFallbackHandlerDeployments).not.toHaveBeenCalled()
  })

  it('should return compatibility fallback handler deployments if chain and safe version are set', () => {
    const mockDeployments = { handler: '0x123' }
    ;(getCompatibilityFallbackHandlerDeployments as jest.Mock).mockReturnValue(mockDeployments)

    const { result } = renderHook(() => useCompatibilityFallbackHandlerDeployments())

    expect(result.current).toEqual(mockDeployments)
    expect(getCompatibilityFallbackHandlerDeployments).toHaveBeenCalledWith({
      network: mockChain.chainId,
      version: mockSafeInfo.safe.version,
    })
  })
})
