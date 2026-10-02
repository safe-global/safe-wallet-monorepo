import { renderHook } from '@/tests/test-utils'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useHasFeature } from '@/hooks/useChains'
import { useIsSafeProAnnouncementEnabled } from '../useIsSafeProAnnouncementEnabled'

jest.mock('@/hooks/useChains')

const mockUseHasFeature = useHasFeature as jest.MockedFunction<typeof useHasFeature>

describe('useIsSafeProAnnouncementEnabled', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('reads the SAFE_PRO_ANNOUNCEMENT flag', () => {
    mockUseHasFeature.mockReturnValue(true)

    renderHook(() => useIsSafeProAnnouncementEnabled())

    expect(mockUseHasFeature).toHaveBeenCalledWith(FEATURES.SAFE_PRO_ANNOUNCEMENT)
  })

  it.each([
    { flag: true, expected: true },
    { flag: false, expected: false },
    { flag: undefined, expected: false },
  ])('returns $expected when the flag is $flag', ({ flag, expected }) => {
    mockUseHasFeature.mockReturnValue(flag)

    const { result } = renderHook(() => useIsSafeProAnnouncementEnabled())

    expect(result.current).toBe(expected)
  })
})
