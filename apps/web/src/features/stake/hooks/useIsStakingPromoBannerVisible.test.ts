import { renderHook } from '@/tests/test-utils'
import useIsStakingPromoBannerVisible, { STAKING_PROMO_BANNER_HIDE_KEY } from './useIsStakingPromoBannerVisible'

jest.mock('./useIsStakingBannerEnabled', () => ({
  __esModule: true,
  default: jest.fn(),
}))
import useIsStakingBannerEnabled from './useIsStakingBannerEnabled'

jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: jest.fn(),
}))
import useSafeInfo from '@/hooks/useSafeInfo'

jest.mock('@/hooks/useBalances', () => ({
  __esModule: true,
  default: jest.fn(),
}))
import useBalances from '@/hooks/useBalances'

const mockIsEnabled = useIsStakingBannerEnabled as jest.MockedFunction<typeof useIsStakingBannerEnabled>
const mockSafeInfo = useSafeInfo as jest.MockedFunction<typeof useSafeInfo>
const mockBalances = useBalances as jest.MockedFunction<typeof useBalances>

describe('useIsStakingPromoBannerVisible', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()

    // Happy-path defaults: flag on, Safe activated, positive balance
    mockIsEnabled.mockReturnValue(true)
    mockSafeInfo.mockReturnValue({ safe: { deployed: true } } as unknown as ReturnType<typeof useSafeInfo>)
    mockBalances.mockReturnValue({ balances: { fiatTotal: '100' } } as unknown as ReturnType<typeof useBalances>)
  })

  it('returns true when enabled, deployed, funded and not dismissed', () => {
    const { result } = renderHook(() => useIsStakingPromoBannerVisible())
    expect(result.current).toBe(true)
  })

  it('returns false when the feature flag is off', () => {
    mockIsEnabled.mockReturnValue(false)
    const { result } = renderHook(() => useIsStakingPromoBannerVisible())
    expect(result.current).toBe(false)
  })

  it('returns false for a counterfactual (not deployed) Safe', () => {
    mockSafeInfo.mockReturnValue({ safe: { deployed: false } } as unknown as ReturnType<typeof useSafeInfo>)
    const { result } = renderHook(() => useIsStakingPromoBannerVisible())
    expect(result.current).toBe(false)
  })

  it('returns false when the fiat balance is zero', () => {
    mockBalances.mockReturnValue({ balances: { fiatTotal: '0' } } as unknown as ReturnType<typeof useBalances>)
    const { result } = renderHook(() => useIsStakingPromoBannerVisible())
    expect(result.current).toBe(false)
  })

  it('returns false when the banner has been dismissed (reads the hide key)', () => {
    localStorage.setItem(`SAFE_v2__${STAKING_PROMO_BANNER_HIDE_KEY}`, JSON.stringify(true))
    const { result } = renderHook(() => useIsStakingPromoBannerVisible())
    expect(result.current).toBe(false)
  })
})
