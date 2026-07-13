import { render, screen } from '@/tests/test-utils'
import SecurityLogin from '../SecurityLogin'
import * as useIsRecoverySupportedHook from '@/features/recovery'
import * as useIsSafeOwnerHook from '@/hooks/useIsSafeOwner'
import * as useVisibleBalancesHook from '@/hooks/useVisibleBalances'
import * as useIsOutreachSafeHook from '@/features/targeted-features'
import * as useWalletHook from '@/hooks/wallets/useWallet'
import * as featureCore from '@/features/__core__'
import { connectedWalletBuilder } from '@/tests/builders/wallet'

// Mock the hypernative hooks at their source modules so internal (relative-import) callers
// like useBannerVisibility are intercepted too — a barrel-namespace spy would not reach them
const mockUseIsHypernativeFeature = jest.fn()
const mockUseIsHypernativeGuard = jest.fn()
const mockUseBannerStorage = jest.fn()

jest.mock('@/features/hypernative/hooks/useIsHypernativeFeature', () => ({
  ...jest.requireActual('@/features/hypernative/hooks/useIsHypernativeFeature'),
  useIsHypernativeFeature: () => mockUseIsHypernativeFeature(),
}))

jest.mock('@/features/hypernative/hooks/useIsHypernativeGuard', () => ({
  ...jest.requireActual('@/features/hypernative/hooks/useIsHypernativeGuard'),
  useIsHypernativeGuard: () => mockUseIsHypernativeGuard(),
}))

jest.mock('@/features/hypernative/hooks/useBannerStorage', () => ({
  ...jest.requireActual('@/features/hypernative/hooks/useBannerStorage'),
  useBannerStorage: (...args: unknown[]) => mockUseBannerStorage(...args),
}))

// Mock HnBannerForSettings from the public API with simulated HOC behavior
jest.mock('@/features/hypernative', () => {
  const actual = jest.requireActual('@/features/hypernative')
  return {
    ...actual,
    HnBannerForSettings: () => {
      const { showBanner, loading } = actual.useBannerVisibility(actual.BannerType.Settings)
      if (loading || !showBanner) return null
      return <div data-testid="hn-banner-for-settings">HnBannerForSettings</div>
    },
  }
})

// Mock useLoadFeature to return HnActivatedSettingsBanner with simulated HOC behavior
jest.mock('@/features/__core__', () => ({
  ...jest.requireActual('@/features/__core__'),
  useLoadFeature: jest.fn(),
}))

const mockUseLoadFeature = featureCore.useLoadFeature as jest.Mock

// Mock SecuritySettings to avoid rendering the full component
jest.mock('../SecuritySettings', () => ({
  __esModule: true,
  default: () => <div data-testid="security-settings">SecuritySettings</div>,
}))

// Component that simulates HOC behavior (withHnFeature -> withGuardCheck -> withOwnerCheck)
const MockHnActivatedSettingsBanner = () => {
  const isEnabled = mockUseIsHypernativeFeature()
  const { isHypernativeGuard, loading } = mockUseIsHypernativeGuard()
  const isOwner = useIsSafeOwnerHook.default()

  if (!isEnabled || loading || !isHypernativeGuard || !isOwner) {
    return null
  }

  return <div data-testid="hn-activated-banner-for-settings">HnActivatedBannerForSettings</div>
}

describe('SecurityLogin', () => {
  const mockWallet = connectedWalletBuilder().build()

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup useLoadFeature mock to return our mock component
    mockUseLoadFeature.mockReturnValue({
      $isDisabled: false,
      $isReady: true,
      HnActivatedSettingsBanner: MockHnActivatedSettingsBanner,
      SwitchAuthenticator: () => null,
    })

    // Default mocks - feature enabled, wallet connected, owner, sufficient balance, not targeted
    jest.spyOn(useIsRecoverySupportedHook, 'useIsRecoverySupported').mockReturnValue(false)
    mockUseIsHypernativeFeature.mockReturnValue(true)
    jest.spyOn(useWalletHook, 'default').mockReturnValue(mockWallet)
    jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(true)
    mockUseBannerStorage.mockReturnValue(true)
    jest.spyOn(useVisibleBalancesHook, 'useVisibleBalances').mockReturnValue({
      balances: { fiatTotal: '2000000', items: [] },
      loaded: true,
      loading: false,
    })
    jest.spyOn(useIsOutreachSafeHook, 'useIsOutreachSafe').mockReturnValue({ isTargeted: false, loading: false })
  })

  describe('when Hypernative guard is active', () => {
    beforeEach(() => {
      mockUseIsHypernativeGuard.mockReturnValue({
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
      mockUseIsHypernativeFeature.mockReturnValue(false)

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
      mockUseIsHypernativeGuard.mockReturnValue({
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
      jest.spyOn(useIsOutreachSafeHook, 'useIsOutreachSafe').mockReturnValue({ isTargeted: true, loading: false })
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
      mockUseIsHypernativeFeature.mockReturnValue(false)

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
      mockUseIsHypernativeGuard.mockReturnValue({
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
      mockUseIsHypernativeGuard.mockReturnValue({
        isHypernativeGuard: true,
        loading: false,
      })

      const { rerender } = render(<SecurityLogin />)

      expect(screen.getByTestId('hn-activated-banner-for-settings')).toBeInTheDocument()
      expect(screen.queryByTestId('hn-banner-for-settings')).not.toBeInTheDocument()

      // Test with guard not active
      mockUseIsHypernativeGuard.mockReturnValue({
        isHypernativeGuard: false,
        loading: false,
      })

      rerender(<SecurityLogin />)

      expect(screen.queryByTestId('hn-activated-banner-for-settings')).not.toBeInTheDocument()
      expect(screen.getByTestId('hn-banner-for-settings')).toBeInTheDocument()
    })

    it('should show HnActivatedBannerForSettings for targeted Safe with guard active, not HnBannerForSettings', () => {
      mockUseIsHypernativeGuard.mockReturnValue({
        isHypernativeGuard: true,
        loading: false,
      })
      jest.spyOn(useIsOutreachSafeHook, 'useIsOutreachSafe').mockReturnValue({ isTargeted: true, loading: false })

      render(<SecurityLogin />)

      expect(screen.getByTestId('hn-activated-banner-for-settings')).toBeInTheDocument()
      expect(screen.queryByTestId('hn-banner-for-settings')).not.toBeInTheDocument()
    })
  })
})
