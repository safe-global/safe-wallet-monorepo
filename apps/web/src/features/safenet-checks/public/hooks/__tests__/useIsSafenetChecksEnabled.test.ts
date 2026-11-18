import { renderHook } from '@testing-library/react'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useHasFeature } from '@/hooks/useChains'
import { useIsSafenetChecksEnabled } from '../useIsSafenetChecksEnabled'

jest.mock('@/hooks/useChains')

const mockUseHasFeature = jest.mocked(useHasFeature)

describe('useIsSafenetChecksEnabled', () => {
  it.each([
    [true, true],
    [false, false],
    [undefined, false],
  ])('should, when the Safenet checks flag is %s, return %s', (flag, expected) => {
    mockUseHasFeature.mockReturnValue(flag)

    const { result } = renderHook(() => useIsSafenetChecksEnabled())

    expect(result.current).toBe(expected)
    expect(mockUseHasFeature).toHaveBeenCalledWith(FEATURES.SAFENET_CHECKS)
  })
})
