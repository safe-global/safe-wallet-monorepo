import { render, screen } from '@testing-library/react'
import PageLayout from './index'
import { AppRoutes } from '@/config/routes'

jest.mock('@/components/common/Header/Topbar', () => {
  const MockTopbar = () => <div data-testid="topbar" />
  MockTopbar.displayName = 'Topbar'
  return { __esModule: true, default: MockTopbar }
})

jest.mock('@/components/common/ClassicViewToast', () => {
  const MockClassicViewToast = () => null
  MockClassicViewToast.displayName = 'ClassicViewToast'
  return { __esModule: true, default: MockClassicViewToast }
})

jest.mock('@/components/common/ClassicViewWarningBorder', () => {
  const MockClassicViewWarningBorder = () => null
  MockClassicViewWarningBorder.displayName = 'ClassicViewWarningBorder'
  return { __esModule: true, default: MockClassicViewWarningBorder }
})

jest.mock('@/components/common/SafeLogo', () => {
  const MockSafeLogo = ({ href }: { href?: string }) => <a data-testid="safe-logo" href={href} />
  MockSafeLogo.displayName = 'SafeLogo'
  return { __esModule: true, default: MockSafeLogo }
})

jest.mock('./SideDrawer', () => {
  const MockSideDrawer = () => <div data-testid="side-drawer" />
  MockSideDrawer.displayName = 'SideDrawer'
  return { __esModule: true, default: MockSideDrawer }
})

jest.mock('@/components/common/Footer', () => {
  const MockFooter = () => <div data-testid="footer" />
  MockFooter.displayName = 'Footer'
  return { __esModule: true, default: MockFooter }
})

jest.mock('@/components/common/SafeLoadingError', () => {
  const MockSafeLoadingError = ({ children }: { children: React.ReactNode }) => <>{children}</>
  MockSafeLoadingError.displayName = 'SafeLoadingError'
  return { __esModule: true, default: MockSafeLoadingError }
})

jest.mock('@/components/common/Breadcrumbs', () => {
  const MockBreadcrumbs = () => <div data-testid="breadcrumbs" />
  MockBreadcrumbs.displayName = 'Breadcrumbs'
  return { __esModule: true, default: MockBreadcrumbs }
})

jest.mock('@/hooks/useIsSidebarRoute', () => ({
  useIsSidebarRoute: jest.fn(() => [false, false]),
}))

jest.mock('@/hooks/useIsSpaceRoute', () => ({
  useIsSpaceRoute: jest.fn(() => false),
}))

jest.mock('@/hooks/useParentSafe', () => ({
  useParentSafe: jest.fn(() => null),
}))

jest.mock('@/hooks/useRouterGuard', () => ({
  useRouterGuard: jest.fn(),
}))

jest.mock('@/hooks/useRouterGuard/activationGuards/useFlowActivationGuard', () => {
  const actual = jest.requireActual('@/hooks/useRouterGuard/activationGuards/useFlowActivationGuard')
  return {
    ...actual,
    useFlowActivationGuard: jest.fn(),
  }
})

jest.mock('@/hooks/useKeyboardObserver', () => ({
  useKeyboardObserver: jest.fn(),
}))

jest.mock('@/hooks/useTopbarElevation', () => ({
  useIsTopbarElevated: jest.fn(() => false),
}))

const mockUseSafeAddressFromUrl = jest.fn<string, []>(() => '')
jest.mock('@/hooks/useSafeAddressFromUrl', () => ({
  useSafeAddressFromUrl: () => mockUseSafeAddressFromUrl(),
}))

jest.mock('@/hooks/useIsRequireLoginEnabled', () => ({
  useIsRequireLoginEnabled: jest.fn(() => false),
}))

const mockUseIsAuthGateBlocking = jest.fn(() => false)
jest.mock('@/hooks/useIsAuthGateBlocking', () => ({
  useIsAuthGateBlocking: () => mockUseIsAuthGateBlocking(),
}))

jest.mock('@/features/__core__', () => ({
  useLoadFeature: jest.fn(() => ({
    BatchSidebar: () => null,
    SelectSafeModal: () => null,
  })),
}))

jest.mock('@/features/batching', () => ({ BatchingFeature: {} }))
jest.mock('@/features/spaces', () => ({ SpacesFeature: {} }))

const STATIC_ROUTES = [AppRoutes.terms, AppRoutes.privacy, AppRoutes.licenses, AppRoutes.imprint, AppRoutes.cookie]

const NON_STATIC_ROUTES = ['/home', '/balances', '/settings/setup', '/welcome/accounts']

describe('PageLayout', () => {
  beforeEach(() => {
    mockUseSafeAddressFromUrl.mockReturnValue('')
    mockUseIsAuthGateBlocking.mockReturnValue(false)
  })

  const renderLayout = (pathname: string) =>
    render(
      <PageLayout pathname={pathname}>
        <div data-testid="page-content" />
      </PageLayout>,
    )

  describe('static legal pages', () => {
    it.each(STATIC_ROUTES.map((r) => [r]))('renders SafeLogo on %s', (pathname) => {
      renderLayout(pathname)
      expect(screen.getByTestId('safe-logo')).toBeInTheDocument()
    })

    it.each(STATIC_ROUTES.map((r) => [r]))('does not render Topbar on %s', (pathname) => {
      renderLayout(pathname)
      expect(screen.queryByTestId('topbar')).not.toBeInTheDocument()
    })

    it('renders SafeLogo without an explicit href (defaults to /welcome/accounts)', () => {
      renderLayout(AppRoutes.terms)
      // href default is handled inside SafeLogo itself — covered by SafeLogo unit tests
      expect(screen.getByTestId('safe-logo')).toBeInTheDocument()
    })
  })

  describe('non-static pages', () => {
    it.each(NON_STATIC_ROUTES.map((r) => [r]))('does not render SafeLogo on %s', (pathname) => {
      renderLayout(pathname)
      expect(screen.queryByTestId('safe-logo')).not.toBeInTheDocument()
    })

    it.each(NON_STATIC_ROUTES.filter((r) => !r.startsWith('/welcome')).map((r) => [r]))(
      'renders Topbar on %s',
      (pathname) => {
        renderLayout(pathname)
        expect(screen.getByTestId('topbar')).toBeInTheDocument()
      },
    )
  })

  describe('/welcome/spaces topbar gating', () => {
    const useIsRequireLoginEnabledModule = jest.requireMock('@/hooks/useIsRequireLoginEnabled') as {
      useIsRequireLoginEnabled: jest.Mock
    }

    afterEach(() => {
      useIsRequireLoginEnabledModule.useIsRequireLoginEnabled.mockReturnValue(false)
    })

    it('renders Topbar on /welcome/spaces when the gate is OFF', () => {
      useIsRequireLoginEnabledModule.useIsRequireLoginEnabled.mockReturnValue(false)
      renderLayout(AppRoutes.welcome.spaces)
      expect(screen.getByTestId('topbar')).toBeInTheDocument()
    })

    it('hides Topbar on /welcome/spaces when the gate is ON', () => {
      useIsRequireLoginEnabledModule.useIsRequireLoginEnabled.mockReturnValue(true)
      renderLayout(AppRoutes.welcome.spaces)
      expect(screen.queryByTestId('topbar')).not.toBeInTheDocument()
    })

    it('still shows Topbar while the flag is loading (undefined)', () => {
      useIsRequireLoginEnabledModule.useIsRequireLoginEnabled.mockReturnValue(undefined)
      renderLayout(AppRoutes.welcome.spaces)
      expect(screen.getByTestId('topbar')).toBeInTheDocument()
    })
  })

  describe('auth gate blocking', () => {
    beforeEach(() => {
      mockUseIsAuthGateBlocking.mockReturnValue(true)
    })

    it('blanks protected pages so background data fetches do not run before the redirect', () => {
      const { container } = renderLayout('/home')
      expect(container).toBeEmptyDOMElement()
      expect(screen.queryByTestId('page-content')).not.toBeInTheDocument()
      expect(screen.queryByTestId('topbar')).not.toBeInTheDocument()
    })

    it('still renders the login page itself so the user can sign in', () => {
      renderLayout(AppRoutes.welcome.spaces)
      expect(screen.getByTestId('page-content')).toBeInTheDocument()
    })

    it('still renders onboarding routes so a partially-onboarded user can finish the flow', () => {
      renderLayout(AppRoutes.welcome.createSpace)
      expect(screen.getByTestId('page-content')).toBeInTheDocument()
    })

    it.each(STATIC_ROUTES.map((r) => [r]))('still renders the always-public legal page %s', (pathname) => {
      renderLayout(pathname)
      expect(screen.getByTestId('page-content')).toBeInTheDocument()
    })
  })

  describe('settings route padding-top', () => {
    it('applies the compact main class on settings without a safe address', () => {
      mockUseSafeAddressFromUrl.mockReturnValue('')
      const { container } = renderLayout('/settings/notifications')
      const main = container.querySelector('main, [class*="main"]')
      expect(main?.className).toMatch(/mainSpaceCompact/)
    })

    it('does not apply the compact main class on settings with a safe address', () => {
      mockUseSafeAddressFromUrl.mockReturnValue('0x1234567890abcdef1234567890abcdef12345678')
      const { container } = renderLayout('/settings/notifications')
      const main = container.querySelector('main, [class*="main"]')
      expect(main?.className).not.toMatch(/mainSpaceCompact/)
    })

    it('does not apply the compact main class on non-settings routes', () => {
      mockUseSafeAddressFromUrl.mockReturnValue('')
      const { container } = renderLayout('/home')
      const main = container.querySelector('main, [class*="main"]')
      expect(main?.className).not.toMatch(/mainSpaceCompact/)
    })
  })
})
