import { fireEvent, render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { makeStore } from '@/store'
import AboutPage from '../pages/AboutPage'
import { AppRoutes } from '@/config/routes'
import { HELP_CENTER_URL } from '@safe-global/utils/config/constants'
import { APP_VERSION, APP_HOMEPAGE } from '@/config/version'
import { selectCookieBanner } from '@/store/popupSlice'
import { CookieAndTermType } from '@/store/cookiesAndTermsSlice'
import { useLoadFeature } from '@/features/__core__'
import { useIsOfficialHost } from '@/hooks/useIsOfficialHost'

const mockSupportChatDrawer = jest.fn()

jest.mock('@/features/__core__', () => ({
  useLoadFeature: jest.fn(),
}))

jest.mock('@/features/support-chat', () => ({
  SupportChatFeature: 'support-chat-feature',
  useSupportChat: () => ({
    config: { appId: 'test-app', chatUrl: 'https://chat.test', aliasDomain: 'test.local', allowedParents: [] },
    user: { email: 'guest@test.local', name: 'Safe{Wallet}' },
  }),
}))

jest.mock('@/hooks/useIsOfficialHost', () => ({
  useIsOfficialHost: jest.fn(),
}))

const setSupportFeature = ({ disabled, isOfficialHost }: { disabled: boolean; isOfficialHost: boolean }) => {
  mockSupportChatDrawer.mockImplementation(({ open }: { open: boolean }) =>
    open ? <div data-testid="support-chat-drawer" /> : null,
  )
  ;(useLoadFeature as jest.Mock).mockReturnValue({
    SupportChatDrawer: mockSupportChatDrawer,
    $isDisabled: disabled,
  })
  ;(useIsOfficialHost as jest.Mock).mockReturnValue(isOfficialHost)
}

const renderWithStore = () => {
  const store = makeStore(undefined, { skipBroadcast: true })
  return {
    store,
    ...render(
      <Provider store={store}>
        <AboutPage />
      </Provider>,
    ),
  }
}

describe('AboutPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setSupportFeature({ disabled: false, isOfficialHost: true })
  })

  describe('legal links', () => {
    it('renders Terms & Conditions with correct href', () => {
      renderWithStore()
      const link = screen.getByRole('link', { name: /Terms & Conditions/i })
      expect(link).toHaveAttribute('href', AppRoutes.terms)
    })

    it('renders Privacy Policy with correct href', () => {
      renderWithStore()
      const link = screen.getByRole('link', { name: /Privacy Policy/i })
      expect(link).toHaveAttribute('href', AppRoutes.privacy)
    })

    it('renders Licenses with correct href', () => {
      renderWithStore()
      const link = screen.getByRole('link', { name: /Licenses/i })
      expect(link).toHaveAttribute('href', AppRoutes.licenses)
    })

    it('renders Imprint with correct href', () => {
      renderWithStore()
      const link = screen.getByRole('link', { name: /Imprint/i })
      expect(link).toHaveAttribute('href', AppRoutes.imprint)
    })

    it('renders Cookie Policy with correct href', () => {
      renderWithStore()
      const link = screen.getByRole('link', { name: /Cookie Policy/i })
      expect(link).toHaveAttribute('href', AppRoutes.cookie)
    })

    it('opens all legal links in a new tab with noopener', () => {
      renderWithStore()
      const legalLinks = [
        screen.getByRole('link', { name: /Terms & Conditions/i }),
        screen.getByRole('link', { name: /Privacy Policy/i }),
        screen.getByRole('link', { name: /Licenses/i }),
        screen.getByRole('link', { name: /Imprint/i }),
        screen.getByRole('link', { name: /Cookie Policy/i }),
      ]
      legalLinks.forEach((link) => {
        expect(link).toHaveAttribute('target', '_blank')
        expect(link).toHaveAttribute('rel', 'noreferrer noopener')
      })
    })
  })

  describe('help links', () => {
    it('renders Help Center link pointing to HELP_CENTER_URL', () => {
      renderWithStore()
      const link = screen.getByRole('link', { name: /Help Center/i })
      expect(link).toHaveAttribute('href', HELP_CENTER_URL)
    })

    it('renders Sync Status link', () => {
      renderWithStore()
      const link = screen.getByRole('link', { name: /Sync Status/i })
      expect(link).toHaveAttribute('href', 'https://status.safe.global')
    })
  })

  describe('Contact Support', () => {
    it('renders Contact Support as a button when the support chat feature is available', () => {
      renderWithStore()
      expect(screen.getByRole('button', { name: /Contact Support/i })).toBeInTheDocument()
      expect(screen.queryByRole('link', { name: /Contact Support/i })).not.toBeInTheDocument()
    })

    it('does not render Contact Support when the feature is disabled', () => {
      setSupportFeature({ disabled: true, isOfficialHost: true })
      renderWithStore()
      expect(screen.queryByRole('button', { name: /Contact Support/i })).not.toBeInTheDocument()
    })

    it('does not render Contact Support on unofficial hosts', () => {
      setSupportFeature({ disabled: false, isOfficialHost: false })
      renderWithStore()
      expect(screen.queryByRole('button', { name: /Contact Support/i })).not.toBeInTheDocument()
    })

    it('opens the support chat drawer when clicked', () => {
      renderWithStore()
      expect(screen.queryByTestId('support-chat-drawer')).not.toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: /Contact Support/i }))

      expect(screen.getByTestId('support-chat-drawer')).toBeInTheDocument()
    })
  })

  describe('version section', () => {
    it('renders the current version badge', () => {
      renderWithStore()
      expect(screen.getByText(`v${APP_VERSION}`)).toBeInTheDocument()
    })

    it('release notes link points to the correct GitHub release URL', () => {
      renderWithStore()
      const link = screen.getByRole('link', { name: /View release notes/i })
      expect(link).toHaveAttribute('href', `${APP_HOMEPAGE}/releases/tag/web-v${APP_VERSION}`)
    })

    it('GitHub button links to APP_HOMEPAGE', () => {
      renderWithStore()
      const link = screen.getByRole('link', { name: /GitHub/i })
      expect(link).toHaveAttribute('href', APP_HOMEPAGE)
    })
  })

  describe('cookie preferences', () => {
    it('renders the cookie preferences button', () => {
      renderWithStore()
      expect(screen.getByTestId('cookie-preferences-button')).toBeInTheDocument()
    })

    it('dispatches openCookieBanner with NECESSARY key when clicked', () => {
      const { store } = renderWithStore()

      fireEvent.click(screen.getByTestId('cookie-preferences-button'))

      const cookieBanner = selectCookieBanner(store.getState())
      expect(cookieBanner.open).toBe(true)
      expect(cookieBanner.warningKey).toBe(CookieAndTermType.NECESSARY)
    })
  })
})
