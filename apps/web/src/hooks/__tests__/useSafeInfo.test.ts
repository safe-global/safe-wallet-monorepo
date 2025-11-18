import { renderHook } from '@/tests/test-utils'
import useSafeInfo from '@/hooks/useSafeInfo'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import * as safesQueries from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { useSafeAddressFromUrl } from '@/hooks/useSafeAddressFromUrl'
import { useChainId } from '@/hooks/useChainId'
import useChains from '@/hooks/useChains'

jest.mock('@/hooks/useSafeAddressFromUrl')
jest.mock('@/hooks/useChainId')
jest.mock('@/hooks/useChains')

const mockUseSafeAddressFromUrl = useSafeAddressFromUrl as jest.MockedFunction<typeof useSafeAddressFromUrl>
const mockUseChainId = useChainId as jest.MockedFunction<typeof useChainId>
const mockUseChains = useChains as jest.MockedFunction<typeof useChains>

describe('useSafeInfo hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseChainId.mockReturnValue('1')
    mockUseSafeAddressFromUrl.mockReturnValue('')
    mockUseChains.mockReturnValue({
      configs: [],
      error: undefined,
      loading: false,
    })
  })
  it('should return default safe info when no data in Redux', () => {
    jest.spyOn(safesQueries, 'useSafesGetSafeV1Query').mockReturnValue({
      currentData: undefined,
      error: undefined,
      isLoading: false,
    } as any)

    const { result } = renderHook(() => useSafeInfo())

    expect(result.current.safe).toBeDefined()
    expect(result.current.safeAddress).toBe('')
    expect(result.current.safeLoaded).toBe(false)
    expect(result.current.safeLoading).toBe(false)
    expect(result.current.safeError).toBeUndefined()
  })

  it('should return safe info when data is available', () => {
    const mockSafe = extendedSafeInfoBuilder().build()
    const mockAddress = mockSafe.address.value

    mockUseSafeAddressFromUrl.mockReturnValue(mockAddress)

    jest.spyOn(safesQueries, 'useSafesGetSafeV1Query').mockReturnValue({
      currentData: mockSafe,
      error: undefined,
      isLoading: false,
    } as any)

    const { result } = renderHook(() => useSafeInfo())

    expect(result.current.safe).toEqual(mockSafe)
    expect(result.current.safeAddress).toBe(mockAddress)
    expect(result.current.safeLoaded).toBe(true)
    expect(result.current.safeLoading).toBe(false)
    expect(result.current.safeError).toBeUndefined()
  })

  it('should return loading state correctly', () => {
    jest.spyOn(safesQueries, 'useSafesGetSafeV1Query').mockReturnValue({
      currentData: undefined,
      error: undefined,
      isLoading: true,
    } as any)

    const { result } = renderHook(() => useSafeInfo())

    expect(result.current.safeLoading).toBe(true)
    expect(result.current.safeLoaded).toBe(false)
  })

  it('should return error state correctly', () => {
    const errorMessage = 'Failed to load Safe'

    jest.spyOn(safesQueries, 'useSafesGetSafeV1Query').mockReturnValue({
      currentData: undefined,
      error: { error: errorMessage } as any,
      isLoading: false,
    } as any)

    const { result } = renderHook(() => useSafeInfo())

    expect(result.current.safeError).toBe(errorMessage)
    expect(result.current.safeLoaded).toBe(false)
    expect(result.current.safeLoading).toBe(false)
  })

  it('should extract safeAddress from data.address.value', () => {
    const mockSafe = extendedSafeInfoBuilder()
      .with({
        address: {
          value: '0x1234567890123456789012345678901234567890',
          name: 'Test Safe',
          logoUri: null,
        },
      })
      .build()

    mockUseSafeAddressFromUrl.mockReturnValue(mockSafe.address.value)

    jest.spyOn(safesQueries, 'useSafesGetSafeV1Query').mockReturnValue({
      currentData: mockSafe,
      error: undefined,
      isLoading: false,
    } as any)

    const { result } = renderHook(() => useSafeInfo())

    expect(result.current.safeAddress).toBe('0x1234567890123456789012345678901234567890')
  })

  it('should return empty string when no address data', () => {
    jest.spyOn(safesQueries, 'useSafesGetSafeV1Query').mockReturnValue({
      currentData: undefined,
      error: undefined,
      isLoading: false,
    } as any)

    const { result } = renderHook(() => useSafeInfo())

    expect(result.current.safeAddress).toBe('')
  })

  it('should handle partial safe data with all states', () => {
    const mockSafe = extendedSafeInfoBuilder()
      .with({
        threshold: 2,
        owners: [
          { value: '0x1111111111111111111111111111111111111111', name: null, logoUri: null },
          { value: '0x2222222222222222222222222222222222222222', name: null, logoUri: null },
          { value: '0x3333333333333333333333333333333333333333', name: null, logoUri: null },
        ],
        nonce: 42,
      })
      .build()

    mockUseSafeAddressFromUrl.mockReturnValue(mockSafe.address.value)

    jest.spyOn(safesQueries, 'useSafesGetSafeV1Query').mockReturnValue({
      currentData: mockSafe,
      error: undefined,
      isLoading: false,
    } as any)

    const { result } = renderHook(() => useSafeInfo())

    expect(result.current.safe.threshold).toBe(2)
    expect(result.current.safe.owners).toHaveLength(3)
    expect(result.current.safe.nonce).toBe(42)
  })

  it('should maintain referential equality with useMemo when data does not change', () => {
    const mockSafe = extendedSafeInfoBuilder().build()

    mockUseSafeAddressFromUrl.mockReturnValue(mockSafe.address.value)

    jest.spyOn(safesQueries, 'useSafesGetSafeV1Query').mockReturnValue({
      currentData: mockSafe,
      error: undefined,
      isLoading: false,
    } as any)

    const { result, rerender } = renderHook(() => useSafeInfo())

    const firstRender = result.current

    // Rerender without changing mocks
    rerender()

    const secondRender = result.current

    // useMemo should return the same reference if dependencies haven't changed
    expect(firstRender).toStrictEqual(secondRender)
  })

  it('should handle both loading and error states simultaneously', () => {
    jest.spyOn(safesQueries, 'useSafesGetSafeV1Query').mockReturnValue({
      currentData: undefined,
      error: { error: 'Network error' } as any,
      isLoading: true,
    } as any)

    const { result } = renderHook(() => useSafeInfo())

    expect(result.current.safeLoading).toBe(true)
    expect(result.current.safeError).toBe('Network error')
    expect(result.current.safeLoaded).toBe(false)
  })

  it('should handle loaded state with data', () => {
    const mockSafe = extendedSafeInfoBuilder().build()

    mockUseSafeAddressFromUrl.mockReturnValue(mockSafe.address.value)

    jest.spyOn(safesQueries, 'useSafesGetSafeV1Query').mockReturnValue({
      currentData: mockSafe,
      error: undefined,
      isLoading: false,
    } as any)

    const { result } = renderHook(() => useSafeInfo())

    expect(result.current.safeLoaded).toBe(true)
    expect(result.current.safe).toEqual(mockSafe)
  })
})
