import { render, screen } from '@/tests/test-utils'
import SecurityLogin from '../SecurityLogin'
import * as useIsRecoverySupportedHook from '@/features/recovery/hooks/useIsRecoverySupported'
import * as useIsHypernativeFeatureHook from '@/features/hypernative/hooks/useIsHypernativeFeature'
import * as useIsHypernativeGuardHook from '@/features/hypernative/hooks/useIsHypernativeGuard'
import * as useIsSafeOwnerHook from '@/hooks/useIsSafeOwner'
import * as useBannerStorageHook from '@/features/hypernative/hooks/useBannerStorage'
import * as useVisibleBalancesHook from '@/hooks/useVisibleBalances'
import * as useIsOutreachSafeHook from '@/features/targetedFeatures/hooks/useIsOutreachSafe'
import * as useWalletHook from '@/hooks/wallets/useWallet'
import { connectedWalletBuilder } from '@/tests/builders/wallet'

// Mock the base banner components to check if they render
// We mock the base components so the HOCs can run and control visibility
jest.mock('@/features/hypernative/components/HnBanner/HnBanner', () => ({
  HnBanner: () => <div data-testid="hn-banner-for-settings">HnBannerForSettings</div>,
}))

jest.mock('@/features/hypernative/components/HnActivatedSettingsBanner/HnActivatedSettingsBanner', () => ({
  HnActivatedSettingsBanner: () => (
    <div data-testid="hn-activated-banner-for-settings">HnActivatedBannerForSettings</div>
  ),
}))

// Mock SecuritySettings to avoid rendering the full component
jest.mock('../SecuritySettings', () => ({
  __esModule: true,
  default: () => <div data-testid="security-settings">SecuritySettings</div>,
}))

describe('SecurityLogin', () => {
  const mockWallet = connectedWalletBuilder().build()

  beforeEach(() => {
    jest.clearAllMocks()

    // Default mocks - feature enabled, wallet connected, owner, sufficient balance, not targeted
    jest.spyOn(useIsRecoverySupportedHook, 'useIsRecoverySupported').mockReturnValue(false)
    jest.spyOn(useIsHypernativeFeatureHook, 'useIsHypernativeFeature').mockReturnValue(true)
    jest.spyOn(useWalletHook, 'default').mockReturnValue(mockWallet)
    jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(true)
    jest.spyOn(useBannerStorageHook, 'useBannerStorage').mockReturnValue(true)
    jest.spyOn(useVisibleBalancesHook, 'useVisibleBalances').mockReturnValue({
      balances: { fiatTotal: '2000000', items: [] },
      loaded: true,
      loading: false,
    })
    jest.spyOn(useIsOutreachSafeHook, 'useIsOutreachSafe').mockReturnValue(false)
  })

  describe('when Hypernative guard is active', () => {
    beforeEach(() => {
      jest.spyOn(useIsHypernativeGuardHook, 'useIsHypernativeGuard').mockReturnValue({
        isHypernativeGuard: true,
        loading: false,
      })
    })

    it('should show HnActivatedBannerForSettings when guard is active and user is owner', () => {
      render(<SecurityLogin />)

      expect(screen.getByTestId('hn-activated-banner-for-settings')).toBeInTheDocument()
      expect(screen.queryByTestId('hn-banner-for-settings')).not.toBeInTheDocument()
    })

    it('should NOT show HnActivatedBannerForSettings when guard is active but user is not owner', () => {
      jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(false)

      render(<SecurityLogin />)

      expect(screen.queryByTestId('hn-activated-banner-for-settings')).not.toBeInTheDocument()
      expect(screen.queryByTestId('hn-banner-for-settings')).not.toBeInTheDocument()
    })

    it('should NOT show HnActivatedBannerForSettings when guard is active but feature is disabled', () => {
      jest.spyOn(useIsHypernativeFeatureHook, 'useIsHypernativeFeature').mockReturnValue(false)

      render(<SecurityLogin />)

      expect(screen.queryByTestId('hn-activated-banner-for-settings')).not.toBeInTheDocument()
      expect(screen.queryByTestId('hn-banner-for-settings')).not.toBeInTheDocument()
    })

    it('should NOT show HnBannerForSettings when guard is active (mutual exclusivity)', () => {
      render(<SecurityLogin />)

      expect(screen.getByTestId('hn-activated-banner-for-settings')).toBeInTheDocument()
      expect(screen.queryByTestId('hn-banner-for-settings')).not.toBeInTheDocument()
    })
  })

  describe('when Hypernative guard is NOT active', () => {
    beforeEach(() => {
      jest.spyOn(useIsHypernativeGuardHook, 'useIsHypernativeGuard').mockReturnValue({
        isHypernativeGuard: false,
        loading: false,
      })
    })

    it('should show HnBannerForSettings when guard is not active and all conditions are met', () => {
      render(<SecurityLogin />)

      expect(screen.getByTestId('hn-banner-for-settings')).toBeInTheDocument()
      expect(screen.queryByTestId('hn-activated-banner-for-settings')).not.toBeInTheDocument()
    })

    it('should show HnBannerForSettings for targeted Safe even with insufficient balance', () => {
      jest.spyOn(useIsOutreachSafeHook, 'useIsOutreachSafe').mockReturnValue(true)
      jest.spyOn(useVisibleBalancesHook, 'useVisibleBalances').mockReturnValue({
        balances: { fiatTotal: '0.5', items: [] },
        loaded: true,
        loading: false,
      })

      render(<SecurityLogin />)

      expect(screen.getByTestId('hn-banner-for-settings')).toBeInTheDocument()
      expect(screen.queryByTestId('hn-activated-banner-for-settings')).not.toBeInTheDocument()
    })

    it('should NOT show HnBannerForSettings when user is not a Safe owner', () => {
      jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(false)

      render(<SecurityLogin />)

      expect(screen.queryByTestId('hn-banner-for-settings')).not.toBeInTheDocument()
      expect(screen.queryByTestId('hn-activated-banner-for-settings')).not.toBeInTheDocument()
    })

    it('should NOT show HnBannerForSettings when feature is disabled', () => {
      jest.spyOn(useIsHypernativeFeatureHook, 'useIsHypernativeFeature').mockReturnValue(false)

      render(<SecurityLogin />)

      expect(screen.queryByTestId('hn-banner-for-settings')).not.toBeInTheDocument()
      expect(screen.queryByTestId('hn-activated-banner-for-settings')).not.toBeInTheDocument()
    })

    it('should NOT show HnBannerForSettings when wallet is not connected', () => {
      jest.spyOn(useWalletHook, 'default').mockReturnValue(null)
      // When wallet is not connected, user is not a Safe owner
      jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(false)

      render(<SecurityLogin />)

      expect(screen.queryByTestId('hn-banner-for-settings')).not.toBeInTheDocument()
      expect(screen.queryByTestId('hn-activated-banner-for-settings')).not.toBeInTheDocument()
    })

    it('should NOT show HnBannerForSettings when balance is insufficient and Safe is not targeted', () => {
      jest.spyOn(useVisibleBalancesHook, 'useVisibleBalances').mockReturnValue({
        balances: { fiatTotal: '0.5', items: [] },
        loaded: true,
        loading: false,
      })

      render(<SecurityLogin />)

      expect(screen.queryByTestId('hn-banner-for-settings')).not.toBeInTheDocument()
      expect(screen.queryByTestId('hn-activated-banner-for-settings')).not.toBeInTheDocument()
    })
  })

  describe('when guard check is loading', () => {
    it('should NOT show either banner while guard check is loading', () => {
      jest.spyOn(useIsHypernativeGuardHook, 'useIsHypernativeGuard').mockReturnValue({
        isHypernativeGuard: false,
        loading: true,
      })

      render(<SecurityLogin />)

      expect(screen.queryByTestId('hn-activated-banner-for-settings')).not.toBeInTheDocument()
      expect(screen.queryByTestId('hn-banner-for-settings')).not.toBeInTheDocument()
    })
  })

  describe('mutual exclusivity', () => {
    it('should never show both banners at the same time', () => {
      // Test with guard active
      jest.spyOn(useIsHypernativeGuardHook, 'useIsHypernativeGuard').mockReturnValue({
        isHypernativeGuard: true,
        loading: false,
      })

      const { rerender } = render(<SecurityLogin />)

      expect(screen.getByTestId('hn-activated-banner-for-settings')).toBeInTheDocument()
      expect(screen.queryByTestId('hn-banner-for-settings')).not.toBeInTheDocument()

      // Test with guard not active
      jest.spyOn(useIsHypernativeGuardHook, 'useIsHypernativeGuard').mockReturnValue({
        isHypernativeGuard: false,
        loading: false,
      })

      rerender(<SecurityLogin />)

      expect(screen.queryByTestId('hn-activated-banner-for-settings')).not.toBeInTheDocument()
      expect(screen.getByTestId('hn-banner-for-settings')).toBeInTheDocument()
    })

    it('should show HnActivatedBannerForSettings for targeted Safe with guard active, not HnBannerForSettings', () => {
      jest.spyOn(useIsHypernativeGuardHook, 'useIsHypernativeGuard').mockReturnValue({
        isHypernativeGuard: true,
        loading: false,
      })
      jest.spyOn(useIsOutreachSafeHook, 'useIsOutreachSafe').mockReturnValue(true)

      render(<SecurityLogin />)

      expect(screen.getByTestId('hn-activated-banner-for-settings')).toBeInTheDocument()
      expect(screen.queryByTestId('hn-banner-for-settings')).not.toBeInTheDocument()
    })
  })
})
