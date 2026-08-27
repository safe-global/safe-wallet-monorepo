import { renderHook } from '@/tests/test-utils'
import { useNativeSwapsCard, SWAPS_APP_CARD_STORAGE_KEY } from './useNativeSwapsCard'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { useIsSwapFeatureEnabled } from '@/features/swap'

jest.mock('@/features/swap', () => ({
  useIsSwapFeatureEnabled: jest.fn(),
}))

jest.mock('@/services/local-storage/useLocalStorage', () => ({
  __esModule: true,
  default: jest.fn(),
}))

const mockUseIsSwapFeatureEnabled = useIsSwapFeatureEnabled as jest.MockedFunction<typeof useIsSwapFeatureEnabled>
const mockUseLocalStorage = useLocalStorage as jest.MockedFunction<typeof useLocalStorage<boolean>>

describe('useNativeSwapsCard', () => {
  const setIsCardVisible = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseIsSwapFeatureEnabled.mockReturnValue(true)
    mockUseLocalStorage.mockReturnValue([undefined, setIsCardVisible])
  })

  it('is visible by default when the swap feature is enabled', () => {
    const { result } = renderHook(() => useNativeSwapsCard())

    expect(mockUseLocalStorage).toHaveBeenCalledWith(SWAPS_APP_CARD_STORAGE_KEY)
    expect(result.current.isVisible).toBe(true)
  })

  it('is hidden once dismissed', () => {
    mockUseLocalStorage.mockReturnValue([false, setIsCardVisible])

    const { result } = renderHook(() => useNativeSwapsCard())

    expect(result.current.isVisible).toBe(false)
  })

  it('is hidden when the swap feature is disabled', () => {
    mockUseIsSwapFeatureEnabled.mockReturnValue(false)
    mockUseLocalStorage.mockReturnValue([true, setIsCardVisible])

    const { result } = renderHook(() => useNativeSwapsCard())

    expect(result.current.isVisible).toBe(false)
  })

  it('persists the dismissal', () => {
    const { result } = renderHook(() => useNativeSwapsCard())

    result.current.dismiss()

    expect(setIsCardVisible).toHaveBeenCalledWith(false)
  })
})
