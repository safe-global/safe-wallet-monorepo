import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import SpacesList from '../index'

const mockUseAppSelector = jest.fn()
const mockUseSpacesGetV1Query = jest.fn()
const mockUseUsersGetWithWalletsV1Query = jest.fn()
const mockUseSignInRedirect = jest.fn()

jest.mock('@/store', () => ({
  useAppSelector: (selector: unknown) => mockUseAppSelector(selector),
}))

jest.mock('@/store/authSlice', () => ({
  isAuthenticated: jest.fn(() => 'isAuthenticated'),
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useSpacesGetV1Query: (...args: unknown[]) => mockUseSpacesGetV1Query(...args),
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/users', () => ({
  useUsersGetWithWalletsV1Query: (...args: unknown[]) => mockUseUsersGetWithWalletsV1Query(...args),
}))

jest.mock('@/components/welcome/WelcomeLogin/hooks/useSignInRedirect', () => ({
  useSignInRedirect: (...args: unknown[]) => mockUseSignInRedirect(...args),
}))

jest.mock('@/hooks/useIsRequireLoginEnabled', () => ({
  useIsRequireLoginEnabled: jest.fn(() => false),
}))

jest.mock('@/hooks/useClassicView', () => ({
  useIsClassicViewFeatureEnabled: jest.fn(() => false),
}))

jest.mock('@/features/__core__', () => ({
  useLoadFeature: () => ({ AccountsNavigation: () => <nav data-testid="accounts-nav" /> }),
  createFeatureHandle: () => ({}),
}))

jest.mock('@/features/myAccounts', () => ({
  MyAccountsFeature: { name: 'MyAccountsFeature' },
}))

jest.mock('@/features/spaces', () => ({
  MemberStatus: { ACTIVE: 'ACTIVE', INVITED: 'INVITED', DECLINED: 'DECLINED' },
}))

jest.mock('@/features/spaces/utils', () => ({
  filterSpacesByStatus: (_user: unknown, spaces: unknown[], status: string) =>
    status === 'INVITED' ? [] : ((spaces as Array<{ name: string; status?: string }>) ?? []),
}))

jest.mock('../../SignInOptions', () => ({
  __esModule: true,
  default: () => <div data-testid="sign-in-options" />,
}))

jest.mock('../../SpaceCard', () => ({
  __esModule: true,
  default: () => <div data-testid="space-card" />,
}))

jest.mock('../../InviteBanner', () => ({
  __esModule: true,
  default: () => <div data-testid="invite-banner" />,
}))

jest.mock('../../SpaceInfoModal', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>,
}))

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
}))

describe('SpacesList — auth/expiry state rendering', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSpacesGetV1Query.mockReturnValue({ currentData: undefined, isFetching: false, error: undefined })
    mockUseUsersGetWithWalletsV1Query.mockReturnValue({ currentData: undefined })
    mockUseSignInRedirect.mockReturnValue({ setHasSignedIn: jest.fn(), redirectLoading: false })
  })

  it('renders the Sign in card (not Create space) when the user is unauthenticated — i.e. after a session expiry redirect', () => {
    // After sessionExpired() runs, setUnauthenticated clears sessionExpiresAt → isAuthenticated returns false.
    mockUseAppSelector.mockReturnValue(false)

    render(<SpacesList />)

    // The signed-out card with Sign in heading + SignInOptions must render…
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByTestId('sign-in-options')).toBeInTheDocument()

    // …and the Create space CTA / no-spaces empty state must NOT.
    expect(screen.queryByText(/^create space$/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/no spaces found/i)).not.toBeInTheDocument()
  })

  it('renders the No-spaces empty state with Create space CTA when the user is authenticated and has no spaces', () => {
    mockUseAppSelector.mockReturnValue(true)
    mockUseSpacesGetV1Query.mockReturnValue({ currentData: [], isFetching: false, error: undefined })
    mockUseUsersGetWithWalletsV1Query.mockReturnValue({ currentData: { id: 1 } })

    render(<SpacesList />)

    expect(screen.getByText(/no workspaces found/i)).toBeInTheDocument()
    // The "Create workspace" CTA link is rendered (Button + NextLink composition).
    expect(screen.getByRole('link', { name: /create workspace/i })).toBeInTheDocument()

    // Sign in card must NOT render in this branch.
    expect(screen.queryByTestId('sign-in-options')).not.toBeInTheDocument()
  })

  it('disables the Create space button and shows a tooltip when the user has reached the 10-space limit', async () => {
    mockUseAppSelector.mockReturnValue(true)
    const tenSpaces = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, name: `Space ${i + 1}` }))
    mockUseSpacesGetV1Query.mockReturnValue({ currentData: tenSpaces, isFetching: false, error: undefined })
    mockUseUsersGetWithWalletsV1Query.mockReturnValue({ currentData: { id: 1 } })

    render(<SpacesList />)

    const button = screen.getByTestId('create-space-button')
    expect(button).toHaveAttribute('disabled')

    await userEvent.hover(button)
    expect(await screen.findByText(/limit of 10 workspaces reached/i)).toBeInTheDocument()
  })
})
