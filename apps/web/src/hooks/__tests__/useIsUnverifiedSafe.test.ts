import { renderHook } from '@testing-library/react'
import useIsUnverifiedSafe from '../useIsUnverifiedSafe'
import useSafeInfo from '../useSafeInfo'
import useChainId from '../useChainId'
import { useSafeAddressFromUrl } from '../useSafeAddressFromUrl'
import { defaultSafeInfo } from '@safe-global/store/slices/SafeInfo/utils'

jest.mock('../useSafeInfo')
jest.mock('../useChainId')
jest.mock('../useSafeAddressFromUrl')

describe('useIsUnverifiedSafe', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns true for fallback safe with no owners', () => {
    const mockAddress = '0x1234567890123456789012345678901234567890'
    const mockChainId = '1'

    ;(useSafeInfo as jest.Mock).mockReturnValue({
      safe: {
        ...defaultSafeInfo,
        address: { value: mockAddress },
        chainId: mockChainId,
        owners: [],
        deployed: false,
      },
    })
    ;(useChainId as jest.Mock).mockReturnValue(mockChainId)
    ;(useSafeAddressFromUrl as jest.Mock).mockReturnValue(mockAddress)

    const { result } = renderHook(() => useIsUnverifiedSafe())

    expect(result.current).toBe(true)
  })

  it('returns false for deployed safe with owners', () => {
    const mockAddress = '0x1234567890123456789012345678901234567890'
    const mockChainId = '1'

    ;(useSafeInfo as jest.Mock).mockReturnValue({
      safe: {
        ...defaultSafeInfo,
        address: { value: mockAddress },
        chainId: mockChainId,
        owners: [{ value: '0xOwner1' }],
        deployed: true,
      },
    })
    ;(useChainId as jest.Mock).mockReturnValue(mockChainId)
    ;(useSafeAddressFromUrl as jest.Mock).mockReturnValue(mockAddress)

    const { result } = renderHook(() => useIsUnverifiedSafe())

    expect(result.current).toBe(false)
  })

  it('returns false when address does not match URL', () => {
    const mockAddress = '0x1234567890123456789012345678901234567890'
    const urlAddress = '0x0987654321098765432109876543210987654321'
    const mockChainId = '1'

    ;(useSafeInfo as jest.Mock).mockReturnValue({
      safe: {
        ...defaultSafeInfo,
        address: { value: mockAddress },
        chainId: mockChainId,
        owners: [],
        deployed: false,
      },
    })
    ;(useChainId as jest.Mock).mockReturnValue(mockChainId)
    ;(useSafeAddressFromUrl as jest.Mock).mockReturnValue(urlAddress)

    const { result } = renderHook(() => useIsUnverifiedSafe())

    expect(result.current).toBe(false)
  })
})
