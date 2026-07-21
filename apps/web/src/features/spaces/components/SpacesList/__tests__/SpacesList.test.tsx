import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import SpacesList from '../index'
import { useIsRequireLoginEnabled } from '@/hooks/useIsRequireLoginEnabled'
import { useIsClassicViewFeatureEnabled } from '@/hooks/useClassicView'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { WorkspaceCreateEntryPoint } from '@/services/analytics/mixpanel-events'

const mockUseIsRequireLoginEnabled = useIsRequireLoginEnabled as jest.Mock
const mockUseIsClassicViewFeatureEnabled = useIsClassicViewFeatureEnabled as jest.Mock
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

jest.mock('@/hooks/useDarkMode', () => ({
  useDarkMode: jest.fn(() => false),
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
  useCurrentMemberProfile: jest.fn(() => ({ membership: undefined, isLoading: false })),
}))

jest.mock('../AccountInfo', () => ({
  AccountInfo: () => <div data-testid="account-info" />,
}))

jest.mock('@/features/spaces/utils', () => ({
  filterSpacesByStatus: (_user: unknown, spaces: Array<{ memberStatus?: string }>, status: string) =>
    (spaces ?? []).filter((space) => (space.memberStatus ?? 'ACTIVE') === status),
  getInvitedByName: () => undefined,
}))

jest.mock('../../SignInOptions', () => ({
  __esModule: true,
  default: () => <div data-testid="sign-in-options" />,
}))

jest.mock('../../ClassicViewLink', () => ({
  __esModule: true,
  default: () => <div data-testid="classic-view-link" />,
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
  // Spread the rest of the props: Button's `render` prop forwards data-testid,
  // className and onClick onto the anchor — dropping them hides the button
  // from queries and swallows click tracking.
  default: ({ children, href, ...props }: { children: ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
}))

describe('SpacesList — auth/expiry state rendering', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // clearAllMocks wipes call history but not implementations, so reset the
    // gate to its default (OFF) each test; gate-ON cases opt in explicitly.
    mockUseIsRequireLoginEnabled.mockReturnValue(false)
    // Expose the escape hatch by default so its visibility hinges only on layout.
    mockUseIsClassicViewFeatureEnabled.mockReturnValue(true)
    mockUseSpacesGetV1Query.mockReturnValue({ currentData: undefined, isFetching: false, error: undefined })
    mockUseUsersGetWithWalletsV1Query.mockReturnValue({ currentData: undefined })
    mockUseSignInRedirect.mockReturnValue({ setHasSignedIn: jest.fn(), redirectLoading: false })
  })

  it('renders the Sign in card (not Create space) when the user is unauthenticated — i.e. after a session expiry redirect', () => {
    // Session-expiry redirect lands on the gate-ON login page.
    mockUseIsRequireLoginEnabled.mockReturnValue(true)
    // After sessionExpired() runs, setUnauthenticated clears sessionExpiresAt → isAuthenticated returns false.
    mockUseAppSelector.mockReturnValue(false)

    render(<SpacesList />)

    // The signed-out card with the new "Sign in to your workspace" heading +
    // SignInOptions must render…
    expect(screen.getByRole('heading', { name: /sign in to your workspace/i })).toBeInTheDocument()
    expect(screen.getByTestId('sign-in-options')).toBeInTheDocument()

    // …and the Create workspace CTA / no-workspaces empty state must NOT.
    expect(screen.queryByText(/^create workspace$/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/no workspaces found/i)).not.toBeInTheDocument()
  })

  // When the require-login gate is OFF, classic view is available and
  // /welcome/spaces keeps its Topbar + tabbed layout. The Accounts/Workspaces
  // tabs must therefore render regardless of auth state, with the sign-in card
  // offered below the tabs.
  it('renders the AccountsNavigation chrome when signed out and require-login is OFF', () => {
    mockUseIsRequireLoginEnabled.mockReturnValue(false)
    mockUseAppSelector.mockReturnValue(false)

    render(<SpacesList />)

    expect(screen.getByTestId('accounts-nav')).toBeInTheDocument()
    expect(screen.getByTestId('sign-in-options')).toBeInTheDocument()
  })

  // When the gate is ON, /welcome/spaces is the canonical full-screen login
  // page: it takes over the viewport (no Topbar) via an early return, so the
  // tabbed layout chrome (AccountsNavigation) must NOT render.
  it('does not render the AccountsNavigation chrome when signed out and require-login is ON', () => {
    mockUseIsRequireLoginEnabled.mockReturnValue(true)
    mockUseAppSelector.mockReturnValue(false)

    render(<SpacesList />)

    expect(screen.queryByTestId('accounts-nav')).not.toBeInTheDocument()
    expect(screen.getByTestId('sign-in-options')).toBeInTheDocument()
  })

  it('renders the AccountsNavigation chrome when the user is signed in (and require-login is OFF)', () => {
    mockUseAppSelector.mockReturnValue(true)
    mockUseSpacesGetV1Query.mockReturnValue({ currentData: [], isFetching: false, error: undefined })
    mockUseUsersGetWithWalletsV1Query.mockReturnValue({ currentData: { id: 1 } })

    render(<SpacesList />)

    expect(screen.getByTestId('accounts-nav')).toBeInTheDocument()
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

  // Regression: on re-login after logout the spaces RTK Query cache entry
  // already exists (the post-logout page load fired a request with stale
  // persisted auth that errored, then invalidateTags marked it stale). When
  // skip flips to false on re-login, both isFetching and isUninitialized are
  // briefly false while currentData is still undefined — the previous fix
  // relied solely on `isFetching || isUninitialized`, which missed this case
  // and bounced existing users into /welcome/create-space. SpacesList must
  // pass isSpacesLoading=true whenever currentData and error are both absent.
  it('passes isSpacesLoading=true to useSignInRedirect when spaces data and error are both undefined', () => {
    mockUseAppSelector.mockReturnValue(true)
    mockUseSpacesGetV1Query.mockReturnValue({
      currentData: undefined,
      isFetching: false,
      isUninitialized: false,
      error: undefined,
    })
    mockUseUsersGetWithWalletsV1Query.mockReturnValue({ currentData: { id: 1 } })

    render(<SpacesList />)

    expect(mockUseSignInRedirect).toHaveBeenCalledWith(expect.objectContaining({ isSpacesLoading: true }))
  })

  it('passes the space uuid as singleSpaceId to useSignInRedirect when the user has exactly one space', () => {
    mockUseAppSelector.mockReturnValue(true)
    mockUseSpacesGetV1Query.mockReturnValue({
      currentData: [{ uuid: 'uuid-1', name: 'Solo Space' }],
      isFetching: false,
      error: undefined,
    })
    mockUseUsersGetWithWalletsV1Query.mockReturnValue({ currentData: { id: 1 } })

    render(<SpacesList />)

    expect(mockUseSignInRedirect).toHaveBeenCalledWith(expect.objectContaining({ singleSpaceId: 'uuid-1' }))
  })

  // A pending invite must not auto-redirect the user into the space — they have
  // no access until they accept, so they stay on the list with the invite banner.
  it('passes singleSpaceId=null and shows the invite banner when the only space is a pending invite', () => {
    mockUseAppSelector.mockReturnValue(true)
    mockUseSpacesGetV1Query.mockReturnValue({
      currentData: [{ uuid: 'uuid-1', name: 'Pending Space', memberStatus: 'INVITED' }],
      isFetching: false,
      error: undefined,
    })
    mockUseUsersGetWithWalletsV1Query.mockReturnValue({ currentData: { id: 1 } })

    render(<SpacesList />)

    expect(mockUseSignInRedirect).toHaveBeenCalledWith(expect.objectContaining({ singleSpaceId: null }))
    expect(screen.getByTestId('invite-banner')).toBeInTheDocument()
    expect(screen.queryByTestId('space-card')).not.toBeInTheDocument()
  })

  it('passes singleSpaceId with inviteAmount>0 so useSignInRedirect skips the auto-redirect, rendering both the active space card and the invite banner', () => {
    mockUseAppSelector.mockReturnValue(true)
    mockUseSpacesGetV1Query.mockReturnValue({
      currentData: [
        { uuid: 'uuid-active', name: 'Active Space', memberStatus: 'ACTIVE' },
        { uuid: 'uuid-invite', name: 'Pending Space', memberStatus: 'INVITED' },
      ],
      isFetching: false,
      error: undefined,
    })
    mockUseUsersGetWithWalletsV1Query.mockReturnValue({ currentData: { id: 1 } })

    render(<SpacesList />)

    expect(mockUseSignInRedirect).toHaveBeenCalledWith(
      expect.objectContaining({ singleSpaceId: 'uuid-active', inviteAmount: 1 }),
    )
    expect(screen.getByTestId('space-card')).toBeInTheDocument()
    expect(screen.getByTestId('invite-banner')).toBeInTheDocument()
  })

  it('passes singleSpaceId=null to useSignInRedirect when the user has multiple spaces', () => {
    mockUseAppSelector.mockReturnValue(true)
    mockUseSpacesGetV1Query.mockReturnValue({
      currentData: [
        { uuid: 'uuid-1', name: 'Space 1' },
        { uuid: 'uuid-2', name: 'Space 2' },
      ],
      isFetching: false,
      error: undefined,
    })
    mockUseUsersGetWithWalletsV1Query.mockReturnValue({ currentData: { id: 1 } })

    render(<SpacesList />)

    expect(mockUseSignInRedirect).toHaveBeenCalledWith(expect.objectContaining({ singleSpaceId: null }))
  })

  // WA-2486: the sign-in card title (logo + heading) is centered, not left-aligned.
  it('centers the "Sign in to your workspace" heading', () => {
    mockUseIsRequireLoginEnabled.mockReturnValue(true)
    mockUseAppSelector.mockReturnValue(false)

    render(<SpacesList />)

    const heading = screen.getByRole('heading', { name: /sign in to your workspace/i })
    expect(heading.className).toContain('text-center')
  })

  // WA-2486: the "By continuing…" Terms/Privacy text is moved out of the card
  // (below it) to reduce text overload inside the box.
  it('renders the "By continuing" text outside the sign-in card', () => {
    mockUseIsRequireLoginEnabled.mockReturnValue(true)
    mockUseAppSelector.mockReturnValue(false)

    const { container } = render(<SpacesList />)

    const card = container.querySelector('.bg-card')
    const termsLink = screen.getByRole('link', { name: /^terms$/i })
    expect(card).toBeInTheDocument()
    expect(card).not.toContainElement(termsLink)
  })

  it('renders the "Use the old UI" link on the full-screen login gate when classic view is exposed', () => {
    mockUseIsRequireLoginEnabled.mockReturnValue(true)
    mockUseAppSelector.mockReturnValue(false)

    render(<SpacesList />)

    expect(screen.getByTestId('classic-view-link')).toBeInTheDocument()
  })

  // Regression (QA): gate OFF means the user is already in the old UI — the link must not reappear.
  it('does not render the "Use the old UI" link in the inline tabbed layout (already in the old UI)', () => {
    mockUseIsRequireLoginEnabled.mockReturnValue(false)
    mockUseAppSelector.mockReturnValue(false)

    render(<SpacesList />)

    expect(screen.getByTestId('sign-in-options')).toBeInTheDocument()
    expect(screen.queryByTestId('classic-view-link')).not.toBeInTheDocument()
  })

  // The Create workspace button must be reachable outside the require-login
  // feature flag too: the classic tabbed layout shows it next to the
  // Accounts/Workspaces tabs when the user is signed in and has spaces.
  it('renders the Create workspace button in the classic tabbed layout when signed in with active spaces', async () => {
    mockUseIsRequireLoginEnabled.mockReturnValue(false)
    mockUseAppSelector.mockReturnValue(true)
    mockUseSpacesGetV1Query.mockReturnValue({
      currentData: [{ uuid: 'uuid-1', name: 'Space 1' }],
      isFetching: false,
      error: undefined,
    })
    mockUseUsersGetWithWalletsV1Query.mockReturnValue({ currentData: { id: 1 } })

    render(<SpacesList />)

    expect(screen.getByTestId('accounts-nav')).toBeInTheDocument()
    const button = screen.getByTestId('create-space-button')
    expect(button).toBeInTheDocument()

    await userEvent.click(button)
    expect(trackEvent).toHaveBeenCalledWith(SPACE_EVENTS.WORKSPACE_CREATE_STARTED, {
      entry_point: WorkspaceCreateEntryPoint.WELCOME,
    })
  })

  it('does not render the Create workspace button in the classic tabbed layout when the user has no active spaces', () => {
    mockUseIsRequireLoginEnabled.mockReturnValue(false)
    mockUseAppSelector.mockReturnValue(true)
    mockUseSpacesGetV1Query.mockReturnValue({ currentData: [], isFetching: false, error: undefined })
    mockUseUsersGetWithWalletsV1Query.mockReturnValue({ currentData: { id: 1 } })

    render(<SpacesList />)

    // The header button is absent; only the empty-state CTA inside the
    // No-workspaces card renders (it lives outside the spacesHeader).
    expect(screen.getByText(/no workspaces found/i)).toBeInTheDocument()
    expect(screen.getAllByTestId('create-space-button')).toHaveLength(1)
  })

  it('renders the AccountInfo sign-out menu on the require-login workspace header when the user is signed in with no spaces', () => {
    mockUseIsRequireLoginEnabled.mockReturnValue(true)
    mockUseAppSelector.mockReturnValue(true)
    mockUseSpacesGetV1Query.mockReturnValue({ currentData: [], isFetching: false, error: undefined })
    mockUseUsersGetWithWalletsV1Query.mockReturnValue({ currentData: { id: 1 } })

    render(<SpacesList />)

    expect(screen.getByText(/no workspaces found/i)).toBeInTheDocument()
    expect(screen.getByTestId('account-info')).toBeInTheDocument()
  })

  it('disables the Create space button and shows a tooltip when the user has reached the 10-space limit', async () => {
    // The Create workspace button lives in the require-login-ON workspace header.
    mockUseIsRequireLoginEnabled.mockReturnValue(true)
    mockUseAppSelector.mockReturnValue(true)
    const tenSpaces = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      uuid: `00000000-0000-0000-0000-0000000000${String(i + 1).padStart(2, '0')}`,
      name: `Space ${i + 1}`,
    }))
    mockUseSpacesGetV1Query.mockReturnValue({ currentData: tenSpaces, isFetching: false, error: undefined })
    mockUseUsersGetWithWalletsV1Query.mockReturnValue({ currentData: { id: 1 } })

    render(<SpacesList />)

    const button = screen.getByTestId('create-space-button')
    // Disabled state renders a <span> (not the NextLink), so there is no native `disabled`
    // attribute — base-ui marks the non-native element with aria-disabled instead.
    expect(button.tagName).toBe('SPAN')
    expect(button).toHaveAttribute('aria-disabled', 'true')

    await userEvent.hover(button)
    expect(await screen.findByText(/limit of 10 workspaces reached/i)).toBeInTheDocument()
  })
})
