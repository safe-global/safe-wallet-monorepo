import { renderHook } from '@/tests/test-utils'
import { useBannerVisibility, MIN_BALANCE_USD } from '../useBannerVisibility'
import { BannerType } from '../useBannerStorage'
import * as useBannerStorageHook from '../useBannerStorage'
import * as useWalletHook from '@/hooks/wallets/useWallet'
import * as useIsSafeOwnerHook from '@/hooks/useIsSafeOwner'
import * as useVisibleBalancesHook from '@/hooks/useVisibleBalances'
import * as useIsHypernativeGuardHook from '../useIsHypernativeGuard'
import * as useIsHypernativeFeatureHook from '../useIsHypernativeFeature'
import { connectedWalletBuilder } from '@/tests/builders/wallet'

describe('useBannerVisibility', () => {
  const mockWallet = connectedWalletBuilder().build()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('when useBannerStorage returns false', () => {
    it('should return showBanner: false, loading: false', () => {
      jest.spyOn(useBannerStorageHook, 'useBannerStorage').mockReturnValue(false)
      jest.spyOn(useWalletHook, 'default').mockReturnValue(mockWallet)
      jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(true)
      jest.spyOn(useVisibleBalancesHook, 'useVisibleBalances').mockReturnValue({
        balances: { fiatTotal: '2000000', items: [] },
        loaded: true,
        loading: false,
      })
      jest.spyOn(useIsHypernativeGuardHook, 'useIsHypernativeGuard').mockReturnValue({
        isHypernativeGuard: false,
        loading: false,
      })

      const { result } = renderHook(() => useBannerVisibility(BannerType.Promo))

      expect(result.current).toEqual({
        showBanner: false,
        loading: false,
      })
    })
  })

  describe('when wallet is not connected', () => {
    it('should return showBanner: false, loading: false', () => {
      jest.spyOn(useBannerStorageHook, 'useBannerStorage').mockReturnValue(true)
      jest.spyOn(useWalletHook, 'default').mockReturnValue(null)
      jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(true)
      jest.spyOn(useVisibleBalancesHook, 'useVisibleBalances').mockReturnValue({
        balances: { fiatTotal: '2000000', items: [] },
        loaded: true,
        loading: false,
      })
      jest.spyOn(useIsHypernativeGuardHook, 'useIsHypernativeGuard').mockReturnValue({
        isHypernativeGuard: false,
        loading: false,
      })

      const { result } = renderHook(() => useBannerVisibility(BannerType.Promo))

      expect(result.current).toEqual({
        showBanner: false,
        loading: false,
      })
    })
  })

  describe('when wallet is not a Safe owner', () => {
    it('should return showBanner: false, loading: false', () => {
      jest.spyOn(useBannerStorageHook, 'useBannerStorage').mockReturnValue(true)
      jest.spyOn(useWalletHook, 'default').mockReturnValue(mockWallet)
      jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(false)
      jest.spyOn(useVisibleBalancesHook, 'useVisibleBalances').mockReturnValue({
        balances: { fiatTotal: '2000000', items: [] },
        loaded: true,
        loading: false,
      })
      jest.spyOn(useIsHypernativeGuardHook, 'useIsHypernativeGuard').mockReturnValue({
        isHypernativeGuard: false,
        loading: false,
      })

      const { result } = renderHook(() => useBannerVisibility(BannerType.Promo))

      expect(result.current).toEqual({
        showBanner: false,
        loading: false,
      })
    })
  })

  describe('when Safe balance is <= MIN_BALANCE_USD', () => {
    it('should return showBanner: false, loading: false when balance equals MIN_BALANCE_USD', () => {
      jest.spyOn(useBannerStorageHook, 'useBannerStorage').mockReturnValue(true)
      jest.spyOn(useWalletHook, 'default').mockReturnValue(mockWallet)
      jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(true)
      jest.spyOn(useVisibleBalancesHook, 'useVisibleBalances').mockReturnValue({
        balances: { fiatTotal: MIN_BALANCE_USD.toString(), items: [] },
        loaded: true,
        loading: false,
      })
      jest.spyOn(useIsHypernativeGuardHook, 'useIsHypernativeGuard').mockReturnValue({
        isHypernativeGuard: false,
        loading: false,
      })

      const { result } = renderHook(() => useBannerVisibility(BannerType.Promo))

      expect(result.current).toEqual({
        showBanner: false,
        loading: false,
      })
    })

    it('should return showBanner: false, loading: false when balance is less than MIN_BALANCE_USD', () => {
      jest.spyOn(useBannerStorageHook, 'useBannerStorage').mockReturnValue(true)
      jest.spyOn(useWalletHook, 'default').mockReturnValue(mockWallet)
      jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(true)
      jest.spyOn(useVisibleBalancesHook, 'useVisibleBalances').mockReturnValue({
        balances: { fiatTotal: '500000', items: [] },
        loaded: true,
        loading: false,
      })
      jest.spyOn(useIsHypernativeGuardHook, 'useIsHypernativeGuard').mockReturnValue({
        isHypernativeGuard: false,
        loading: false,
      })

      const { result } = renderHook(() => useBannerVisibility(BannerType.Promo))

      expect(result.current).toEqual({
        showBanner: false,
        loading: false,
      })
    })

    it('should return showBanner: false, loading: false when fiatTotal is empty string', () => {
      jest.spyOn(useBannerStorageHook, 'useBannerStorage').mockReturnValue(true)
      jest.spyOn(useWalletHook, 'default').mockReturnValue(mockWallet)
      jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(true)
      jest.spyOn(useVisibleBalancesHook, 'useVisibleBalances').mockReturnValue({
        balances: { fiatTotal: '', items: [] },
        loaded: true,
        loading: false,
      })
      jest.spyOn(useIsHypernativeGuardHook, 'useIsHypernativeGuard').mockReturnValue({
        isHypernativeGuard: false,
        loading: false,
      })

      const { result } = renderHook(() => useBannerVisibility(BannerType.Promo))

      expect(result.current).toEqual({
        showBanner: false,
        loading: false,
      })
    })
  })

  describe('when HypernativeGuard is present', () => {
    it('should return showBanner: false, loading: false', () => {
      jest.spyOn(useBannerStorageHook, 'useBannerStorage').mockReturnValue(true)
      jest.spyOn(useWalletHook, 'default').mockReturnValue(mockWallet)
      jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(true)
      jest.spyOn(useVisibleBalancesHook, 'useVisibleBalances').mockReturnValue({
        balances: { fiatTotal: '2000000', items: [] },
        loaded: true,
        loading: false,
      })
      jest.spyOn(useIsHypernativeGuardHook, 'useIsHypernativeGuard').mockReturnValue({
        isHypernativeGuard: true,
        loading: false,
      })

      const { result } = renderHook(() => useBannerVisibility(BannerType.Promo))

      expect(result.current).toEqual({
        showBanner: false,
        loading: false,
      })
    })
  })

  describe('when all conditions are met', () => {
    it('should return showBanner: true, loading: false', () => {
      jest.spyOn(useIsHypernativeFeatureHook, 'useIsHypernativeFeature').mockReturnValue(true)
      jest.spyOn(useBannerStorageHook, 'useBannerStorage').mockReturnValue(true)
      jest.spyOn(useWalletHook, 'default').mockReturnValue(mockWallet)
      jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(true)
      jest.spyOn(useVisibleBalancesHook, 'useVisibleBalances').mockReturnValue({
        balances: { fiatTotal: '2000000', items: [] },
        loaded: true,
        loading: false,
      })
      jest.spyOn(useIsHypernativeGuardHook, 'useIsHypernativeGuard').mockReturnValue({
        isHypernativeGuard: false,
        loading: false,
      })

      const { result } = renderHook(() => useBannerVisibility(BannerType.Promo))

      expect(result.current).toEqual({
        showBanner: true,
        loading: false,
      })
    })
  })

  describe('loading states', () => {
    it('should return loading: true when balances are loading', () => {
      jest.spyOn(useBannerStorageHook, 'useBannerStorage').mockReturnValue(true)
      jest.spyOn(useWalletHook, 'default').mockReturnValue(mockWallet)
      jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(true)
      jest.spyOn(useVisibleBalancesHook, 'useVisibleBalances').mockReturnValue({
        balances: { fiatTotal: '2000000', items: [] },
        loaded: false,
        loading: true,
      })
      jest.spyOn(useIsHypernativeGuardHook, 'useIsHypernativeGuard').mockReturnValue({
        isHypernativeGuard: false,
        loading: false,
      })

      const { result } = renderHook(() => useBannerVisibility(BannerType.Promo))

      expect(result.current).toEqual({
        showBanner: false,
        loading: true,
      })
    })

    it('should return loading: true when guard check is loading', () => {
      jest.spyOn(useBannerStorageHook, 'useBannerStorage').mockReturnValue(true)
      jest.spyOn(useWalletHook, 'default').mockReturnValue(mockWallet)
      jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(true)
      jest.spyOn(useVisibleBalancesHook, 'useVisibleBalances').mockReturnValue({
        balances: { fiatTotal: '2000000', items: [] },
        loaded: true,
        loading: false,
      })
      jest.spyOn(useIsHypernativeGuardHook, 'useIsHypernativeGuard').mockReturnValue({
        isHypernativeGuard: false,
        loading: true,
      })

      const { result } = renderHook(() => useBannerVisibility(BannerType.Promo))

      expect(result.current).toEqual({
        showBanner: false,
        loading: true,
      })
    })

    it('should return loading: true when both balances and guard check are loading', () => {
      jest.spyOn(useBannerStorageHook, 'useBannerStorage').mockReturnValue(true)
      jest.spyOn(useWalletHook, 'default').mockReturnValue(mockWallet)
      jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(true)
      jest.spyOn(useVisibleBalancesHook, 'useVisibleBalances').mockReturnValue({
        balances: { fiatTotal: '2000000', items: [] },
        loaded: false,
        loading: true,
      })
      jest.spyOn(useIsHypernativeGuardHook, 'useIsHypernativeGuard').mockReturnValue({
        isHypernativeGuard: false,
        loading: true,
      })

      const { result } = renderHook(() => useBannerVisibility(BannerType.Promo))

      expect(result.current).toEqual({
        showBanner: false,
        loading: true,
      })
    })
  })

  describe('BannerType handling', () => {
    it('should work with BannerType.Promo', () => {
      jest.spyOn(useIsHypernativeFeatureHook, 'useIsHypernativeFeature').mockReturnValue(true)
      jest.spyOn(useBannerStorageHook, 'useBannerStorage').mockReturnValue(true)
      jest.spyOn(useWalletHook, 'default').mockReturnValue(mockWallet)
      jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(true)
      jest.spyOn(useVisibleBalancesHook, 'useVisibleBalances').mockReturnValue({
        balances: { fiatTotal: '2000000', items: [] },
        loaded: true,
        loading: false,
      })
      jest.spyOn(useIsHypernativeGuardHook, 'useIsHypernativeGuard').mockReturnValue({
        isHypernativeGuard: false,
        loading: false,
      })

      const { result } = renderHook(() => useBannerVisibility(BannerType.Promo))

      expect(result.current.showBanner).toBe(true)
      expect(useBannerStorageHook.useBannerStorage).toHaveBeenCalledWith(BannerType.Promo)
    })

    it('should work with BannerType.Pending', () => {
      jest.spyOn(useIsHypernativeFeatureHook, 'useIsHypernativeFeature').mockReturnValue(true)
      jest.spyOn(useBannerStorageHook, 'useBannerStorage').mockReturnValue(true)
      jest.spyOn(useWalletHook, 'default').mockReturnValue(mockWallet)
      jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(true)
      jest.spyOn(useVisibleBalancesHook, 'useVisibleBalances').mockReturnValue({
        balances: { fiatTotal: '2000000', items: [] },
        loaded: true,
        loading: false,
      })
      jest.spyOn(useIsHypernativeGuardHook, 'useIsHypernativeGuard').mockReturnValue({
        isHypernativeGuard: false,
        loading: false,
      })

      const { result } = renderHook(() => useBannerVisibility(BannerType.Pending))

      expect(result.current.showBanner).toBe(true)
      expect(useBannerStorageHook.useBannerStorage).toHaveBeenCalledWith(BannerType.Pending)
    })
  })

  describe('edge cases', () => {
    it('should handle balance exactly above MIN_BALANCE_USD', () => {
      jest.spyOn(useIsHypernativeFeatureHook, 'useIsHypernativeFeature').mockReturnValue(true)
      jest.spyOn(useBannerStorageHook, 'useBannerStorage').mockReturnValue(true)
      jest.spyOn(useWalletHook, 'default').mockReturnValue(mockWallet)
      jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(true)
      jest.spyOn(useVisibleBalancesHook, 'useVisibleBalances').mockReturnValue({
        balances: { fiatTotal: (MIN_BALANCE_USD + 1).toString(), items: [] },
        loaded: true,
        loading: false,
      })
      jest.spyOn(useIsHypernativeGuardHook, 'useIsHypernativeGuard').mockReturnValue({
        isHypernativeGuard: false,
        loading: false,
      })

      const { result } = renderHook(() => useBannerVisibility(BannerType.Promo))

      expect(result.current).toEqual({
        showBanner: true,
        loading: false,
      })
    })

    it('should handle very large balance values', () => {
      jest.spyOn(useIsHypernativeFeatureHook, 'useIsHypernativeFeature').mockReturnValue(true)
      jest.spyOn(useBannerStorageHook, 'useBannerStorage').mockReturnValue(true)
      jest.spyOn(useWalletHook, 'default').mockReturnValue(mockWallet)
      jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(true)
      jest.spyOn(useVisibleBalancesHook, 'useVisibleBalances').mockReturnValue({
        balances: { fiatTotal: '1000000000', items: [] },
        loaded: true,
        loading: false,
      })
      jest.spyOn(useIsHypernativeGuardHook, 'useIsHypernativeGuard').mockReturnValue({
        isHypernativeGuard: false,
        loading: false,
      })

      const { result } = renderHook(() => useBannerVisibility(BannerType.Promo))

      expect(result.current).toEqual({
        showBanner: true,
        loading: false,
      })
    })

    it('should handle invalid fiatTotal string gracefully', () => {
      jest.spyOn(useBannerStorageHook, 'useBannerStorage').mockReturnValue(true)
      jest.spyOn(useWalletHook, 'default').mockReturnValue(mockWallet)
      jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(true)
      jest.spyOn(useVisibleBalancesHook, 'useVisibleBalances').mockReturnValue({
        balances: { fiatTotal: 'invalid', items: [] },
        loaded: true,
        loading: false,
      })
      jest.spyOn(useIsHypernativeGuardHook, 'useIsHypernativeGuard').mockReturnValue({
        isHypernativeGuard: false,
        loading: false,
      })

      const { result } = renderHook(() => useBannerVisibility(BannerType.Promo))

      // Number('invalid') returns NaN, which is falsy, so balance check fails
      expect(result.current).toEqual({
        showBanner: false,
        loading: false,
      })
    })

    it('should handle zero balance', () => {
      jest.spyOn(useBannerStorageHook, 'useBannerStorage').mockReturnValue(true)
      jest.spyOn(useWalletHook, 'default').mockReturnValue(mockWallet)
      jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(true)
      jest.spyOn(useVisibleBalancesHook, 'useVisibleBalances').mockReturnValue({
        balances: { fiatTotal: '0', items: [] },
        loaded: true,
        loading: false,
      })
      jest.spyOn(useIsHypernativeGuardHook, 'useIsHypernativeGuard').mockReturnValue({
        isHypernativeGuard: false,
        loading: false,
      })

      const { result } = renderHook(() => useBannerVisibility(BannerType.Promo))

      expect(result.current).toEqual({
        showBanner: false,
        loading: false,
      })
    })

    it('should handle negative balance string (should default to 0)', () => {
      jest.spyOn(useBannerStorageHook, 'useBannerStorage').mockReturnValue(true)
      jest.spyOn(useWalletHook, 'default').mockReturnValue(mockWallet)
      jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(true)
      jest.spyOn(useVisibleBalancesHook, 'useVisibleBalances').mockReturnValue({
        balances: { fiatTotal: '-100', items: [] },
        loaded: true,
        loading: false,
      })
      jest.spyOn(useIsHypernativeGuardHook, 'useIsHypernativeGuard').mockReturnValue({
        isHypernativeGuard: false,
        loading: false,
      })

      const { result } = renderHook(() => useBannerVisibility(BannerType.Promo))

      expect(result.current).toEqual({
        showBanner: false,
        loading: false,
      })
    })
  })

  describe('multiple condition failures', () => {
    it('should return false when multiple conditions fail', () => {
      jest.spyOn(useBannerStorageHook, 'useBannerStorage').mockReturnValue(false)
      jest.spyOn(useWalletHook, 'default').mockReturnValue(null)
      jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(false)
      jest.spyOn(useVisibleBalancesHook, 'useVisibleBalances').mockReturnValue({
        balances: { fiatTotal: '500000', items: [] },
        loaded: true,
        loading: false,
      })
      jest.spyOn(useIsHypernativeGuardHook, 'useIsHypernativeGuard').mockReturnValue({
        isHypernativeGuard: true,
        loading: false,
      })

      const { result } = renderHook(() => useBannerVisibility(BannerType.Promo))

      expect(result.current).toEqual({
        showBanner: false,
        loading: false,
      })
    })

    it('should return false when all conditions fail except one', () => {
      jest.spyOn(useIsHypernativeFeatureHook, 'useIsHypernativeFeature').mockReturnValue(true)
      jest.spyOn(useBannerStorageHook, 'useBannerStorage').mockReturnValue(true)
      jest.spyOn(useWalletHook, 'default').mockReturnValue(mockWallet)
      jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(true)
      jest.spyOn(useVisibleBalancesHook, 'useVisibleBalances').mockReturnValue({
        balances: { fiatTotal: '0', items: [] },
        loaded: true,
        loading: false,
      })
      jest.spyOn(useIsHypernativeGuardHook, 'useIsHypernativeGuard').mockReturnValue({
        isHypernativeGuard: false,
        loading: false,
      })

      const { result } = renderHook(() => useBannerVisibility(BannerType.Promo))

      // Only balance check fails
      expect(result.current).toEqual({
        showBanner: false,
        loading: false,
      })
    })
  })

  describe('helper function behavior', () => {
    it('should correctly evaluate all conditions together', () => {
      // Test that the helper function correctly combines all conditions
      jest.spyOn(useIsHypernativeFeatureHook, 'useIsHypernativeFeature').mockReturnValue(true)
      jest.spyOn(useBannerStorageHook, 'useBannerStorage').mockReturnValue(true)
      jest.spyOn(useWalletHook, 'default').mockReturnValue(mockWallet)
      jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(true)
      jest.spyOn(useVisibleBalancesHook, 'useVisibleBalances').mockReturnValue({
        balances: { fiatTotal: '2000000', items: [] },
        loaded: true,
        loading: false,
      })
      jest.spyOn(useIsHypernativeGuardHook, 'useIsHypernativeGuard').mockReturnValue({
        isHypernativeGuard: false,
        loading: false,
      })

      const { result } = renderHook(() => useBannerVisibility(BannerType.Promo))

      expect(result.current.showBanner).toBe(true)
      expect(result.current.loading).toBe(false)
    })

    it('should handle balance threshold boundary correctly', () => {
      // Test balance exactly at threshold (should fail)
      jest.spyOn(useBannerStorageHook, 'useBannerStorage').mockReturnValue(true)
      jest.spyOn(useWalletHook, 'default').mockReturnValue(mockWallet)
      jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(true)
      jest.spyOn(useVisibleBalancesHook, 'useVisibleBalances').mockReturnValue({
        balances: { fiatTotal: MIN_BALANCE_USD.toString(), items: [] },
        loaded: true,
        loading: false,
      })
      jest.spyOn(useIsHypernativeGuardHook, 'useIsHypernativeGuard').mockReturnValue({
        isHypernativeGuard: false,
        loading: false,
      })

      const { result } = renderHook(() => useBannerVisibility(BannerType.Promo))

      // Balance equals threshold, should fail (> not >=)
      expect(result.current.showBanner).toBe(false)
    })
  })
})
