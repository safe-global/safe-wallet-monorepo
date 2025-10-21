import { renderHook } from '@testing-library/react'
import useIsNoFeeNovemberBannerVisible from '@/hooks/useIsNoFeeNovemberBannerVisible'

describe('useIsNoFeeNovemberBannerVisible', () => {
  it('should return true for testing (mock implementation)', () => {
    const { result } = renderHook(() => useIsNoFeeNovemberBannerVisible())

    expect(result.current).toBe(true)
  })
})
