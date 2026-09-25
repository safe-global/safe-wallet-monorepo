import { renderHook } from '@testing-library/react'
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

  it.each([true, false, undefined])('returns %s when the flag lookup returns %s', (value) => {
    mockUseHasFeature.mockReturnValue(value)

    const { result } = renderHook(() => useIsSafeProEnabled())

    expect(result.current).toBe(value)
  })
})
