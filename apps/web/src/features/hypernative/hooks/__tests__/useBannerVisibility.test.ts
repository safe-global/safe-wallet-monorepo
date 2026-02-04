import { renderHook } from '@/tests/test-utils'
import { useBannerVisibility, MIN_BALANCE_USD } from '../useBannerVisibility'
import { BannerType } from '../useBannerStorage'
import * as useBannerStorageHook from '../useBannerStorage'
import * as useWalletHook from '@/hooks/wallets/useWallet'
import * as useIsSafeOwnerHook from '@/hooks/useIsSafeOwner'
import * as useVisibleBalancesHook from '@/hooks/useVisibleBalances'
import * as useIsHypernativeGuardHook from '../useIsHypernativeGuard'
import * as useIsHypernativeFeatureHook from '../useIsHypernativeFeature'
import * as useIsOutreachSafeHook from '@/features/targeted-features'
import { HYPERNATIVE_OUTREACH_ID, HYPERNATIVE_ALLOWLIST_OUTREACH_ID } from '../../constants'
import { connectedWalletBuilder } from '@/tests/builders/wallet'

describe('useBannerVisibility', () => {
  const mockWallet = connectedWalletBuilder().build()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(useIsOutreachSafeHook, 'useIsOutreachSafe').mockReturnValue({ isTargeted: false, loading: false })
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

  describe('when outreach targeting is loading', () => {
    it('should return loading: true and hide banners until targeting resolves', () => {
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
      jest.spyOn(useIsOutreachSafeHook, 'useIsOutreachSafe').mockReturnValue({ isTargeted: false, loading: true })

      const { result } = renderHook(() => useBannerVisibility(BannerType.Promo))

      expect(result.current).toEqual({
        showBanner: false,
        loading: true,
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

  describe('BannerType.TxReportButton', () => {
    describe('when banner conditions are met', () => {
      it('should show button when all banner conditions pass and no guard', () => {
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

        const { result } = renderHook(() => useBannerVisibility(BannerType.TxReportButton))

        expect(result.current).toEqual({
          showBanner: true,
          loading: false,
        })
      })
    })

    describe('when guard is installed', () => {
      it('should show button when guard is installed AND isEnabled AND isSafeOwner', () => {
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
          isHypernativeGuard: true,
          loading: false,
        })

        const { result } = renderHook(() => useBannerVisibility(BannerType.TxReportButton))

        expect(result.current).toEqual({
          showBanner: true,
          loading: false,
        })
      })

      it('should show button when guard is installed and banner conditions are also met', () => {
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
          isHypernativeGuard: true,
          loading: false,
        })

        const { result } = renderHook(() => useBannerVisibility(BannerType.TxReportButton))

        expect(result.current).toEqual({
          showBanner: true,
          loading: false,
        })
      })

      it('should NOT show button when guard is installed but feature is disabled', () => {
        jest.spyOn(useIsHypernativeFeatureHook, 'useIsHypernativeFeature').mockReturnValue(false)
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

        const { result } = renderHook(() => useBannerVisibility(BannerType.TxReportButton))

        expect(result.current).toEqual({
          showBanner: false,
          loading: false,
        })
      })

      it('should NOT show button when guard is installed but user is not an owner', () => {
        jest.spyOn(useIsHypernativeFeatureHook, 'useIsHypernativeFeature').mockReturnValue(true)
        jest.spyOn(useBannerStorageHook, 'useBannerStorage').mockReturnValue(true)
        jest.spyOn(useWalletHook, 'default').mockReturnValue(mockWallet)
        jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(false)
        jest.spyOn(useVisibleBalancesHook, 'useVisibleBalances').mockReturnValue({
          balances: { fiatTotal: '2000000', items: [] },
          loaded: true,
          loading: false,
        })
        jest.spyOn(useIsHypernativeGuardHook, 'useIsHypernativeGuard').mockReturnValue({
          isHypernativeGuard: true,
          loading: false,
        })

        const { result } = renderHook(() => useBannerVisibility(BannerType.TxReportButton))

        expect(result.current).toEqual({
          showBanner: false,
          loading: false,
        })
      })
    })

    describe('when neither banner conditions nor guard are present', () => {
      it('should not show button when user is not an owner and no guard', () => {
        jest.spyOn(useIsHypernativeFeatureHook, 'useIsHypernativeFeature').mockReturnValue(true)
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

        const { result } = renderHook(() => useBannerVisibility(BannerType.TxReportButton))

        expect(result.current).toEqual({
          showBanner: false,
          loading: false,
        })
      })

      it('should not show button when balance is insufficient and no guard', () => {
        jest.spyOn(useIsHypernativeFeatureHook, 'useIsHypernativeFeature').mockReturnValue(true)
        jest.spyOn(useBannerStorageHook, 'useBannerStorage').mockReturnValue(true)
        jest.spyOn(useWalletHook, 'default').mockReturnValue(mockWallet)
        jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(true)
        jest.spyOn(useVisibleBalancesHook, 'useVisibleBalances').mockReturnValue({
          balances: { fiatTotal: '0.5', items: [] },
          loaded: true,
          loading: false,
        })
        jest.spyOn(useIsHypernativeGuardHook, 'useIsHypernativeGuard').mockReturnValue({
          isHypernativeGuard: false,
          loading: false,
        })

        const { result } = renderHook(() => useBannerVisibility(BannerType.TxReportButton))

        expect(result.current).toEqual({
          showBanner: false,
          loading: false,
        })
      })

      it('should not show button when feature is disabled and no guard', () => {
        jest.spyOn(useIsHypernativeFeatureHook, 'useIsHypernativeFeature').mockReturnValue(false)
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

        const { result } = renderHook(() => useBannerVisibility(BannerType.TxReportButton))

        expect(result.current).toEqual({
          showBanner: false,
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

        const { result } = renderHook(() => useBannerVisibility(BannerType.TxReportButton))

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

        const { result } = renderHook(() => useBannerVisibility(BannerType.TxReportButton))

        expect(result.current).toEqual({
          showBanner: false,
          loading: true,
        })
      })
    })
  })

  describe('targeted Safe functionality', () => {
    describe('when Safe is in targeted list', () => {
      it('should show banner for Promo type when Safe is targeted, even with insufficient balance', () => {
        jest.spyOn(useIsHypernativeFeatureHook, 'useIsHypernativeFeature').mockReturnValue(true)
        jest.spyOn(useBannerStorageHook, 'useBannerStorage').mockReturnValue(true)
        jest.spyOn(useWalletHook, 'default').mockReturnValue(mockWallet)
        jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(true)
        jest.spyOn(useVisibleBalancesHook, 'useVisibleBalances').mockReturnValue({
          balances: { fiatTotal: '0.5', items: [] }, // Insufficient balance
          loaded: true,
          loading: false,
        })
        jest.spyOn(useIsHypernativeGuardHook, 'useIsHypernativeGuard').mockReturnValue({
          isHypernativeGuard: false,
          loading: false,
        })
        jest.spyOn(useIsOutreachSafeHook, 'useIsOutreachSafe').mockReturnValue({ isTargeted: true, loading: false }) // Safe is targeted

        const { result } = renderHook(() => useBannerVisibility(BannerType.Promo))

        expect(result.current).toEqual({
          showBanner: true,
          loading: false,
        })
      })

      it('should show banner when Safe is targeted and has 0 balance (no assets)', () => {
        jest.spyOn(useIsHypernativeFeatureHook, 'useIsHypernativeFeature').mockReturnValue(true)
        jest.spyOn(useBannerStorageHook, 'useBannerStorage').mockReturnValue(true)
        jest.spyOn(useWalletHook, 'default').mockReturnValue(mockWallet)
        jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(true)
        jest.spyOn(useVisibleBalancesHook, 'useVisibleBalances').mockReturnValue({
          balances: {
            fiatTotal: '0',
            items: [], // No assets (all items filtered out when balance is '0')
          },
          loaded: true,
          loading: false,
        })
        jest.spyOn(useIsHypernativeGuardHook, 'useIsHypernativeGuard').mockReturnValue({
          isHypernativeGuard: false,
          loading: false,
        })
        jest.spyOn(useIsOutreachSafeHook, 'useIsOutreachSafe').mockReturnValue({ isTargeted: true, loading: false }) // Safe is targeted

        const { result } = renderHook(() => useBannerVisibility(BannerType.Promo))

        expect(result.current).toEqual({
          showBanner: true,
          loading: false,
        })

        expect(useIsOutreachSafeHook.useIsOutreachSafe).toHaveBeenCalledWith(HYPERNATIVE_OUTREACH_ID, { skip: false })
      })

      it('should show banner for NoBalanceCheck type when Safe is targeted', () => {
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
        jest.spyOn(useIsOutreachSafeHook, 'useIsOutreachSafe').mockReturnValue({ isTargeted: true, loading: false })

        const { result } = renderHook(() => useBannerVisibility(BannerType.NoBalanceCheck))

        expect(result.current).toEqual({
          showBanner: true,
          loading: false,
        })
      })

      it('should show banner for Settings type when Safe is targeted', () => {
        jest.spyOn(useIsHypernativeFeatureHook, 'useIsHypernativeFeature').mockReturnValue(true)
        jest.spyOn(useBannerStorageHook, 'useBannerStorage').mockReturnValue(true)
        jest.spyOn(useWalletHook, 'default').mockReturnValue(mockWallet)
        jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(true)
        jest.spyOn(useVisibleBalancesHook, 'useVisibleBalances').mockReturnValue({
          balances: { fiatTotal: '0.5', items: [] },
          loaded: true,
          loading: false,
        })
        jest.spyOn(useIsHypernativeGuardHook, 'useIsHypernativeGuard').mockReturnValue({
          isHypernativeGuard: false,
          loading: false,
        })
        jest.spyOn(useIsOutreachSafeHook, 'useIsOutreachSafe').mockReturnValue({ isTargeted: true, loading: false })

        const { result } = renderHook(() => useBannerVisibility(BannerType.Settings))

        expect(result.current).toEqual({
          showBanner: true,
          loading: false,
        })
      })

      it('should NOT show banner if user is not a Safe owner, even when Safe is targeted', () => {
        jest.spyOn(useIsHypernativeFeatureHook, 'useIsHypernativeFeature').mockReturnValue(true)
        jest.spyOn(useBannerStorageHook, 'useBannerStorage').mockReturnValue(true)
        jest.spyOn(useWalletHook, 'default').mockReturnValue(mockWallet)
        jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(false) // Not an owner
        jest.spyOn(useVisibleBalancesHook, 'useVisibleBalances').mockReturnValue({
          balances: { fiatTotal: '2000000', items: [] },
          loaded: true,
          loading: false,
        })
        jest.spyOn(useIsHypernativeGuardHook, 'useIsHypernativeGuard').mockReturnValue({
          isHypernativeGuard: false,
          loading: false,
        })
        jest.spyOn(useIsOutreachSafeHook, 'useIsOutreachSafe').mockReturnValue({ isTargeted: true, loading: false }) // Safe is targeted

        const { result } = renderHook(() => useBannerVisibility(BannerType.Promo))

        expect(result.current).toEqual({
          showBanner: false,
          loading: false,
        })
      })

      it('should NOT show banner if HypernativeGuard is installed, even when Safe is targeted', () => {
        jest.spyOn(useIsHypernativeFeatureHook, 'useIsHypernativeFeature').mockReturnValue(true)
        jest.spyOn(useBannerStorageHook, 'useBannerStorage').mockReturnValue(true)
        jest.spyOn(useWalletHook, 'default').mockReturnValue(mockWallet)
        jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(true)
        jest.spyOn(useVisibleBalancesHook, 'useVisibleBalances').mockReturnValue({
          balances: { fiatTotal: '0.5', items: [] },
          loaded: true,
          loading: false,
        })
        jest.spyOn(useIsHypernativeGuardHook, 'useIsHypernativeGuard').mockReturnValue({
          isHypernativeGuard: true, // Guard installed
          loading: false,
        })
        jest.spyOn(useIsOutreachSafeHook, 'useIsOutreachSafe').mockReturnValue({ isTargeted: true, loading: false }) // Safe is targeted

        const { result } = renderHook(() => useBannerVisibility(BannerType.Promo))

        expect(result.current).toEqual({
          showBanner: false,
          loading: false,
        })
      })

      it('should NOT show banner if feature is disabled, even when Safe is targeted', () => {
        jest.spyOn(useIsHypernativeFeatureHook, 'useIsHypernativeFeature').mockReturnValue(false)
        jest.spyOn(useBannerStorageHook, 'useBannerStorage').mockReturnValue(true)
        jest.spyOn(useWalletHook, 'default').mockReturnValue(mockWallet)
        jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(true)
        jest.spyOn(useVisibleBalancesHook, 'useVisibleBalances').mockReturnValue({
          balances: { fiatTotal: '0.5', items: [] },
          loaded: true,
          loading: false,
        })
        jest.spyOn(useIsHypernativeGuardHook, 'useIsHypernativeGuard').mockReturnValue({
          isHypernativeGuard: false,
          loading: false,
        })
        jest.spyOn(useIsOutreachSafeHook, 'useIsOutreachSafe').mockReturnValue({ isTargeted: true, loading: false }) // Safe is targeted

        const { result } = renderHook(() => useBannerVisibility(BannerType.Promo))

        expect(result.current).toEqual({
          showBanner: false,
          loading: false,
        })
      })

      it('should NOT show banner if banner storage returns false, even when Safe is targeted', () => {
        jest.spyOn(useIsHypernativeFeatureHook, 'useIsHypernativeFeature').mockReturnValue(true)
        jest.spyOn(useBannerStorageHook, 'useBannerStorage').mockReturnValue(false) // Banner dismissed/completed
        jest.spyOn(useWalletHook, 'default').mockReturnValue(mockWallet)
        jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(true)
        jest.spyOn(useVisibleBalancesHook, 'useVisibleBalances').mockReturnValue({
          balances: { fiatTotal: '0.5', items: [] },
          loaded: true,
          loading: false,
        })
        jest.spyOn(useIsHypernativeGuardHook, 'useIsHypernativeGuard').mockReturnValue({
          isHypernativeGuard: false,
          loading: false,
        })
        jest.spyOn(useIsOutreachSafeHook, 'useIsOutreachSafe').mockReturnValue({ isTargeted: true, loading: false }) // Safe is targeted

        const { result } = renderHook(() => useBannerVisibility(BannerType.Promo))

        expect(result.current).toEqual({
          showBanner: false,
          loading: false,
        })
      })
    })

    describe('when Safe is NOT in targeted list', () => {
      it('should NOT show banner when Safe is not targeted and balance is insufficient', () => {
        jest.spyOn(useIsHypernativeFeatureHook, 'useIsHypernativeFeature').mockReturnValue(true)
        jest.spyOn(useBannerStorageHook, 'useBannerStorage').mockReturnValue(true)
        jest.spyOn(useWalletHook, 'default').mockReturnValue(mockWallet)
        jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(true)
        jest.spyOn(useVisibleBalancesHook, 'useVisibleBalances').mockReturnValue({
          balances: { fiatTotal: '0.5', items: [] }, // Insufficient balance
          loaded: true,
          loading: false,
        })
        jest.spyOn(useIsHypernativeGuardHook, 'useIsHypernativeGuard').mockReturnValue({
          isHypernativeGuard: false,
          loading: false,
        })
        jest.spyOn(useIsOutreachSafeHook, 'useIsOutreachSafe').mockReturnValue({ isTargeted: false, loading: false }) // Safe is NOT targeted

        const { result } = renderHook(() => useBannerVisibility(BannerType.Promo))

        expect(result.current).toEqual({
          showBanner: false,
          loading: false,
        })
      })

      it('should show banner when Safe is not targeted but balance is sufficient', () => {
        jest.spyOn(useIsHypernativeFeatureHook, 'useIsHypernativeFeature').mockReturnValue(true)
        jest.spyOn(useBannerStorageHook, 'useBannerStorage').mockReturnValue(true)
        jest.spyOn(useWalletHook, 'default').mockReturnValue(mockWallet)
        jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(true)
        jest.spyOn(useVisibleBalancesHook, 'useVisibleBalances').mockReturnValue({
          balances: { fiatTotal: '2000000', items: [] }, // Sufficient balance
          loaded: true,
          loading: false,
        })
        jest.spyOn(useIsHypernativeGuardHook, 'useIsHypernativeGuard').mockReturnValue({
          isHypernativeGuard: false,
          loading: false,
        })
        jest.spyOn(useIsOutreachSafeHook, 'useIsOutreachSafe').mockReturnValue({ isTargeted: false, loading: false }) // Safe is NOT targeted

        const { result } = renderHook(() => useBannerVisibility(BannerType.Promo))

        expect(result.current).toEqual({
          showBanner: true,
          loading: false,
        })
      })
    })

    describe('targeting API error handling', () => {
      it('should NOT show banner when targeting API returns error, even if Safe would be targeted', () => {
        jest.spyOn(useIsHypernativeFeatureHook, 'useIsHypernativeFeature').mockReturnValue(true)
        jest.spyOn(useBannerStorageHook, 'useBannerStorage').mockReturnValue(true)
        jest.spyOn(useWalletHook, 'default').mockReturnValue(mockWallet)
        jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(true)
        jest.spyOn(useVisibleBalancesHook, 'useVisibleBalances').mockReturnValue({
          balances: { fiatTotal: '0.5', items: [] },
          loaded: true,
          loading: false,
        })
        jest.spyOn(useIsHypernativeGuardHook, 'useIsHypernativeGuard').mockReturnValue({
          isHypernativeGuard: false,
          loading: false,
        })
        // API error - returns false (useIsOutreachSafe handles errors gracefully)
        jest.spyOn(useIsOutreachSafeHook, 'useIsOutreachSafe').mockReturnValue({ isTargeted: false, loading: false })

        const { result } = renderHook(() => useBannerVisibility(BannerType.Promo))

        expect(result.current).toEqual({
          showBanner: false,
          loading: false,
        })
      })

      it('should NOT show banner when targeting API times out, even if Safe would be targeted', () => {
        jest.spyOn(useIsHypernativeFeatureHook, 'useIsHypernativeFeature').mockReturnValue(true)
        jest.spyOn(useBannerStorageHook, 'useBannerStorage').mockReturnValue(true)
        jest.spyOn(useWalletHook, 'default').mockReturnValue(mockWallet)
        jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(true)
        jest.spyOn(useVisibleBalancesHook, 'useVisibleBalances').mockReturnValue({
          balances: { fiatTotal: '0.5', items: [] },
          loaded: true,
          loading: false,
        })
        jest.spyOn(useIsHypernativeGuardHook, 'useIsHypernativeGuard').mockReturnValue({
          isHypernativeGuard: false,
          loading: false,
        })
        // Timeout - returns false
        jest.spyOn(useIsOutreachSafeHook, 'useIsOutreachSafe').mockReturnValue({ isTargeted: false, loading: false })

        const { result } = renderHook(() => useBannerVisibility(BannerType.Promo))

        expect(result.current).toEqual({
          showBanner: false,
          loading: false,
        })
      })
    })

    describe('campaign-specific targeting', () => {
      it('should use correct outreach ID (3) for Hypernative campaign', () => {
        jest.spyOn(useIsHypernativeFeatureHook, 'useIsHypernativeFeature').mockReturnValue(true)
        jest.spyOn(useBannerStorageHook, 'useBannerStorage').mockReturnValue(true)
        jest.spyOn(useWalletHook, 'default').mockReturnValue(mockWallet)
        jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(true)
        jest.spyOn(useVisibleBalancesHook, 'useVisibleBalances').mockReturnValue({
          balances: { fiatTotal: '0.5', items: [] },
          loaded: true,
          loading: false,
        })
        jest.spyOn(useIsHypernativeGuardHook, 'useIsHypernativeGuard').mockReturnValue({
          isHypernativeGuard: false,
          loading: false,
        })
        const useIsOutreachSafeSpy = jest
          .spyOn(useIsOutreachSafeHook, 'useIsOutreachSafe')
          .mockReturnValue({ isTargeted: true, loading: false })

        renderHook(() => useBannerVisibility(BannerType.Promo))

        expect(useIsOutreachSafeSpy).toHaveBeenNthCalledWith(1, HYPERNATIVE_OUTREACH_ID, { skip: false })
        expect(useIsOutreachSafeSpy).toHaveBeenNthCalledWith(2, HYPERNATIVE_ALLOWLIST_OUTREACH_ID, { skip: true })
      })

      it('should NOT show banner for previous campaigns (different outreachId)', () => {
        jest.spyOn(useIsHypernativeFeatureHook, 'useIsHypernativeFeature').mockReturnValue(true)
        jest.spyOn(useBannerStorageHook, 'useBannerStorage').mockReturnValue(true)
        jest.spyOn(useWalletHook, 'default').mockReturnValue(mockWallet)
        jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(true)
        jest.spyOn(useVisibleBalancesHook, 'useVisibleBalances').mockReturnValue({
          balances: { fiatTotal: '0.5', items: [] },
          loaded: true,
          loading: false,
        })
        jest.spyOn(useIsHypernativeGuardHook, 'useIsHypernativeGuard').mockReturnValue({
          isHypernativeGuard: false,
          loading: false,
        })
        // Previous campaign (outreachId: 2) - should not affect Hypernative banners
        jest.spyOn(useIsOutreachSafeHook, 'useIsOutreachSafe').mockReturnValue({ isTargeted: false, loading: false })

        const { result } = renderHook(() => useBannerVisibility(BannerType.Promo))

        expect(result.current).toEqual({
          showBanner: false,
          loading: false,
        })
      })
    })

    describe('TxReportButton with targeted Safe', () => {
      it('should show button when Safe is targeted, even with insufficient balance and no guard', () => {
        jest.spyOn(useIsHypernativeFeatureHook, 'useIsHypernativeFeature').mockReturnValue(true)
        jest.spyOn(useBannerStorageHook, 'useBannerStorage').mockReturnValue(true)
        jest.spyOn(useWalletHook, 'default').mockReturnValue(mockWallet)
        jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(true)
        jest.spyOn(useVisibleBalancesHook, 'useVisibleBalances').mockReturnValue({
          balances: { fiatTotal: '0.5', items: [] }, // Insufficient balance
          loaded: true,
          loading: false,
        })
        jest.spyOn(useIsHypernativeGuardHook, 'useIsHypernativeGuard').mockReturnValue({
          isHypernativeGuard: false,
          loading: false,
        })
        jest.spyOn(useIsOutreachSafeHook, 'useIsOutreachSafe').mockReturnValue({ isTargeted: true, loading: false }) // Safe is targeted

        const { result } = renderHook(() => useBannerVisibility(BannerType.TxReportButton))

        expect(result.current).toEqual({
          showBanner: true,
          loading: false,
        })
      })

      it('should show button when Safe is targeted and guard is also installed', () => {
        jest.spyOn(useIsHypernativeFeatureHook, 'useIsHypernativeFeature').mockReturnValue(true)
        jest.spyOn(useBannerStorageHook, 'useBannerStorage').mockReturnValue(true)
        jest.spyOn(useWalletHook, 'default').mockReturnValue(mockWallet)
        jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(true)
        jest.spyOn(useVisibleBalancesHook, 'useVisibleBalances').mockReturnValue({
          balances: { fiatTotal: '0.5', items: [] },
          loaded: true,
          loading: false,
        })
        jest.spyOn(useIsHypernativeGuardHook, 'useIsHypernativeGuard').mockReturnValue({
          isHypernativeGuard: true,
          loading: false,
        })
        jest.spyOn(useIsOutreachSafeHook, 'useIsOutreachSafe').mockReturnValue({ isTargeted: true, loading: false }) // Safe is targeted

        const { result } = renderHook(() => useBannerVisibility(BannerType.TxReportButton))

        expect(result.current).toEqual({
          showBanner: true,
          loading: false,
        })
      })

      it('should show button when Safe is allowlisted even if promo targeting fails', () => {
        jest.spyOn(useIsHypernativeFeatureHook, 'useIsHypernativeFeature').mockReturnValue(true)
        jest.spyOn(useBannerStorageHook, 'useBannerStorage').mockReturnValue(true)
        jest.spyOn(useWalletHook, 'default').mockReturnValue(mockWallet)
        jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(true)
        jest.spyOn(useVisibleBalancesHook, 'useVisibleBalances').mockReturnValue({
          balances: { fiatTotal: '0.5', items: [] },
          loaded: true,
          loading: false,
        })
        jest.spyOn(useIsHypernativeGuardHook, 'useIsHypernativeGuard').mockReturnValue({
          isHypernativeGuard: false,
          loading: false,
        })
        const useIsOutreachSafeSpy = jest.spyOn(useIsOutreachSafeHook, 'useIsOutreachSafe')
        useIsOutreachSafeSpy.mockImplementation((outreachId, opts) => {
          if (outreachId === HYPERNATIVE_OUTREACH_ID) {
            expect(opts).toEqual({ skip: true })
            return { isTargeted: false, loading: false }
          }
          if (outreachId === HYPERNATIVE_ALLOWLIST_OUTREACH_ID) {
            expect(opts).toEqual({ skip: false })
            return { isTargeted: true, loading: false }
          }
          return { isTargeted: false, loading: false }
        })

        const { result } = renderHook(() => useBannerVisibility(BannerType.TxReportButton))

        expect(result.current).toEqual({
          showBanner: true,
          loading: false,
        })
        expect(useIsOutreachSafeSpy).toHaveBeenNthCalledWith(1, HYPERNATIVE_OUTREACH_ID, { skip: true })
        expect(useIsOutreachSafeSpy).toHaveBeenNthCalledWith(2, HYPERNATIVE_ALLOWLIST_OUTREACH_ID, { skip: false })
      })

      it('should NOT show button when Safe is not targeted, balance is insufficient, and no guard', () => {
        jest.spyOn(useIsHypernativeFeatureHook, 'useIsHypernativeFeature').mockReturnValue(true)
        jest.spyOn(useBannerStorageHook, 'useBannerStorage').mockReturnValue(true)
        jest.spyOn(useWalletHook, 'default').mockReturnValue(mockWallet)
        jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(true)
        jest.spyOn(useVisibleBalancesHook, 'useVisibleBalances').mockReturnValue({
          balances: { fiatTotal: '0.5', items: [] }, // Insufficient balance
          loaded: true,
          loading: false,
        })
        jest.spyOn(useIsHypernativeGuardHook, 'useIsHypernativeGuard').mockReturnValue({
          isHypernativeGuard: false,
          loading: false,
        })
        jest.spyOn(useIsOutreachSafeHook, 'useIsOutreachSafe').mockReturnValue({ isTargeted: false, loading: false }) // Safe is NOT targeted

        const { result } = renderHook(() => useBannerVisibility(BannerType.TxReportButton))

        expect(result.current).toEqual({
          showBanner: false,
          loading: false,
        })
      })
    })
  })
})
