import { renderHook } from '@testing-library/react'
import useIsPinnedSafe from '../useIsPinnedSafe'
import * as store from '@/store'
import * as useSafeInfo from '@/hooks/useSafeInfo'

describe('useIsPinnedSafe', () => {
  const mockSafeAddress = '0x1234567890abcdef1234567890abcdef12345678'
  const mockChainId = '1'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return true when safe is pinned', () => {
    jest.spyOn(useSafeInfo, 'default').mockReturnValue({
      safe: { chainId: mockChainId } as ReturnType<typeof useSafeInfo.default>['safe'],
      safeAddress: mockSafeAddress,
      safeLoaded: true,
      safeLoading: false,
      safeError: undefined,
    })

    jest.spyOn(store, 'useAppSelector').mockReturnValue({
      [mockChainId]: {
        [mockSafeAddress]: { owners: [], threshold: 1 },
      },
    })

    const { result } = renderHook(() => useIsPinnedSafe())

    expect(result.current).toBe(true)
  })

  it('should return false when safe is not pinned', () => {
    jest.spyOn(useSafeInfo, 'default').mockReturnValue({
      safe: { chainId: mockChainId } as ReturnType<typeof useSafeInfo.default>['safe'],
      safeAddress: mockSafeAddress,
      safeLoaded: true,
      safeLoading: false,
      safeError: undefined,
    })

    jest.spyOn(store, 'useAppSelector').mockReturnValue({})

    const { result } = renderHook(() => useIsPinnedSafe())

    expect(result.current).toBe(false)
  })

  it('should return false when safe is on different chain', () => {
    jest.spyOn(useSafeInfo, 'default').mockReturnValue({
      safe: { chainId: mockChainId } as ReturnType<typeof useSafeInfo.default>['safe'],
      safeAddress: mockSafeAddress,
      safeLoaded: true,
      safeLoading: false,
      safeError: undefined,
    })

    jest.spyOn(store, 'useAppSelector').mockReturnValue({
      '10': {
        [mockSafeAddress]: { owners: [], threshold: 1 },
      },
    })

    const { result } = renderHook(() => useIsPinnedSafe())

    expect(result.current).toBe(false)
  })

  it('should return false when chainId is missing', () => {
    jest.spyOn(useSafeInfo, 'default').mockReturnValue({
      safe: { chainId: '' } as ReturnType<typeof useSafeInfo.default>['safe'],
      safeAddress: mockSafeAddress,
      safeLoaded: false,
      safeLoading: false,
      safeError: undefined,
    })

    jest.spyOn(store, 'useAppSelector').mockReturnValue({
      [mockChainId]: {
        [mockSafeAddress]: { owners: [], threshold: 1 },
      },
    })

    const { result } = renderHook(() => useIsPinnedSafe())

    expect(result.current).toBe(false)
  })

  it('should return false when safeAddress is missing', () => {
    jest.spyOn(useSafeInfo, 'default').mockReturnValue({
      safe: { chainId: mockChainId } as ReturnType<typeof useSafeInfo.default>['safe'],
      safeAddress: '',
      safeLoaded: false,
      safeLoading: false,
      safeError: undefined,
    })

    jest.spyOn(store, 'useAppSelector').mockReturnValue({
      [mockChainId]: {
        [mockSafeAddress]: { owners: [], threshold: 1 },
      },
    })

    const { result } = renderHook(() => useIsPinnedSafe())

    expect(result.current).toBe(false)
  })

  it('should return true when addresses match with different casing', () => {
    const lowercaseAddress = mockSafeAddress.toLowerCase()
    const checksummedAddress = '0x1234567890AbCdEf1234567890aBcDeF12345678'

    jest.spyOn(useSafeInfo, 'default').mockReturnValue({
      safe: { chainId: mockChainId } as ReturnType<typeof useSafeInfo.default>['safe'],
      safeAddress: checksummedAddress,
      safeLoaded: true,
      safeLoading: false,
      safeError: undefined,
    })

    // Stored with lowercase
    jest.spyOn(store, 'useAppSelector').mockReturnValue({
      [mockChainId]: {
        [lowercaseAddress]: { owners: [], threshold: 1 },
      },
    })

    const { result } = renderHook(() => useIsPinnedSafe())

    expect(result.current).toBe(true)
  })

  it('should return true when stored address is checksummed but lookup is lowercase', () => {
    const checksummedAddress = '0x1234567890AbCdEf1234567890aBcDeF12345678'

    jest.spyOn(useSafeInfo, 'default').mockReturnValue({
      safe: { chainId: mockChainId } as ReturnType<typeof useSafeInfo.default>['safe'],
      safeAddress: mockSafeAddress.toLowerCase(),
      safeLoaded: true,
      safeLoading: false,
      safeError: undefined,
    })

    // Stored with checksummed address
    jest.spyOn(store, 'useAppSelector').mockReturnValue({
      [mockChainId]: {
        [checksummedAddress]: { owners: [], threshold: 1 },
      },
    })

    const { result } = renderHook(() => useIsPinnedSafe())

    expect(result.current).toBe(true)
  })
})
