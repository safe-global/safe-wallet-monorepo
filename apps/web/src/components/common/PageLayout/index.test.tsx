import { render, screen } from '@testing-library/react'
import PageLayout from './index'
import { AppRoutes } from '@/config/routes'

jest.mock('@/components/common/Header/Topbar', () => {
  const MockTopbar = () => <div data-testid="topbar" />
  MockTopbar.displayName = 'Topbar'
  return { __esModule: true, default: MockTopbar }
})

jest.mock('@/components/common/SafeLogo', () => {
  const MockSafeLogo = ({ href, 'data-testid': testId }: { href?: string; 'data-testid'?: string }) => (
    <a data-testid={testId ?? 'safe-logo'} href={href} />
  )
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

const mockUseIsSignedIn = jest.fn(() => false)
jest.mock('@/hooks/useIsSignedIn', () => ({
  useIsSignedIn: () => mockUseIsSignedIn(),
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
    mockUseIsSignedIn.mockReturnValue(false)
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

  describe('welcome pages topbar gating (/welcome/spaces and /)', () => {
    it('renders Topbar on /welcome/spaces when the user is signed in', () => {
      mockUseIsSignedIn.mockReturnValue(true)
      renderLayout(AppRoutes.welcome.spaces)
      expect(screen.getByTestId('topbar')).toBeInTheDocument()
    })

    it('hides Topbar on /welcome/spaces when the user is signed out (sign-in form rendered)', () => {
      mockUseIsSignedIn.mockReturnValue(false)
      renderLayout(AppRoutes.welcome.spaces)
      expect(screen.queryByTestId('topbar')).not.toBeInTheDocument()
    })

    it('renders Topbar on /', () => {
      renderLayout(AppRoutes.index)
      expect(screen.getByTestId('topbar')).toBeInTheDocument()
    })
  })

  describe('welcome pages Safe logo', () => {
    it.each([[AppRoutes.welcome.spaces], [AppRoutes.welcome.accounts]])(
      'shows the Safe logo on %s when signed out (no Topbar)',
      (pathname) => {
        mockUseIsSignedIn.mockReturnValue(false)
        renderLayout(pathname)
        expect(screen.getByTestId('welcome-safe-logo')).toBeInTheDocument()
      },
    )

    it('does not duplicate the logo when signed in (the Topbar is shown instead)', () => {
      mockUseIsSignedIn.mockReturnValue(true)
      renderLayout(AppRoutes.welcome.accounts)
      expect(screen.queryByTestId('welcome-safe-logo')).not.toBeInTheDocument()
      expect(screen.getByTestId('topbar')).toBeInTheDocument()
    })
  })

  describe('accounts page topbar gating (/welcome/accounts)', () => {
    it('renders Topbar on /welcome/accounts when the user is signed in', () => {
      mockUseIsSignedIn.mockReturnValue(true)
      renderLayout(AppRoutes.welcome.accounts)
      expect(screen.getByTestId('topbar')).toBeInTheDocument()
    })

    it('renders Topbar on /welcome/accounts when the user is signed out', () => {
      mockUseIsSignedIn.mockReturnValue(false)
      renderLayout(AppRoutes.welcome.accounts)
      expect(screen.getByTestId('topbar')).toBeInTheDocument()
    })
  })
})
