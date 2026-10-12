import { renderHook } from '@/tests/test-utils'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useHasFeature } from '@/hooks/useChains'
import { useIsSafeProEnabled } from '@/hooks/useIsSafeProEnabled'

jest.mock('@/hooks/useChains')

const mockUseHasFeature = useHasFeature as jest.MockedFunction<typeof useHasFeature>

describe('useIsSafeProEnabled', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('reads the SAFE_PRO flag', () => {
    mockUseHasFeature.mockReturnValue(true)

    renderHook(() => useIsSafeProEnabled())

    expect(mockUseHasFeature).toHaveBeenCalledWith(FEATURES.SAFE_PRO)
  })

  it.each([
    { flag: true, expected: true },
    { flag: false, expected: false },
    { flag: undefined, expected: false },
  ])('returns $expected when the flag is $flag', ({ flag, expected }) => {
    mockUseHasFeature.mockReturnValue(flag)

    const { result } = renderHook(() => useIsSafeProEnabled())

    expect(result.current).toBe(expected)
  })
})
