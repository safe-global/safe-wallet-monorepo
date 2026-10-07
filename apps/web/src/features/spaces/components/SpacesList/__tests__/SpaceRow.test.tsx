import { http, HttpResponse } from 'msw'
import { render, screen, waitFor } from '@/tests/test-utils'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'
import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { EntitlementsPlan } from '@safe-global/store/gateway/AUTO_GENERATED/entitlements'
import SpaceRow from '../SpaceRow'
import { AppRoutes } from '@/config/routes'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import userEvent from '@testing-library/user-event'

jest.mock('@/public/images/safe-pro/pro-chip.svg', () => 'svg')
const mockUseIsSafeProEnabled = jest.fn()
jest.mock('@/hooks/useIsSafeProEnabled', () => ({ useIsSafeProEnabled: () => mockUseIsSafeProEnabled() }))
jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
}))

const space = {
  uuid: 'uuid-1',
  name: 'My Space',
  safeCount: 2,
  memberCount: 3,
  members: [],
} as unknown as GetSpaceResponse

const signedIn = {
  initialReduxState: {
    auth: {
      sessionExpiresAt: Date.now() + 60_000,
      landingSpaceHint: null,
      isStoreHydrated: true,
      cfSafeSynced: false,
      isOidcLoginPending: false,
      isSessionCheckPending: false,
    },
  },
}

const businessPlan = (status: EntitlementsPlan['status']): EntitlementsPlan => ({
  id: 'business',
  name: 'Business',
  cycleEndsAt: null,
  status,
})

const serveEntitlements = (plans: Record<string, EntitlementsPlan | null>) => {
  const requests = { count: 0 }
  server.use(
    http.get(`${GATEWAY_URL}/v1/spaces/entitlements`, () => {
      requests.count += 1
      const body = Object.fromEntries(Object.entries(plans).map(([id, plan]) => [id, { plan, entitlements: [] }]))
      return HttpResponse.json(body)
    }),
  )
  return requests
}

describe('SpaceRow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseIsSafeProEnabled.mockReturnValue(true)
  })

  it('renders the workspace summary as a link into the workspace', () => {
    render(<SpaceRow space={space} />)

    expect(screen.getByText('My Space')).toBeInTheDocument()
    expect(screen.getByText(/2 Accounts/)).toBeInTheDocument()
    expect(screen.getByText(/3 Members/)).toBeInTheDocument()

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', `${AppRoutes.spaces.index}?spaceId=${space.uuid}`)
  })

  it('shows the PRO pill with the plan name for an active plan', async () => {
    serveEntitlements({ [space.uuid]: businessPlan('active') })
    render(<SpaceRow space={space} />, signedIn)

    expect(await screen.findByTestId('space-row-pro-badge')).toHaveTextContent('· Business')
  })

  it('keeps the PRO pill without a label when an active plan has no name', async () => {
    serveEntitlements({ [space.uuid]: { ...businessPlan('active'), name: null } })
    render(<SpaceRow space={space} />, signedIn)

    expect(await screen.findByTestId('space-row-pro-badge')).toHaveTextContent(/^$/)
  })

  it('shows Free access instead of the plan name during a trial', async () => {
    serveEntitlements({ [space.uuid]: businessPlan('trialing') })
    render(<SpaceRow space={space} />, signedIn)

    const badge = await screen.findByTestId('space-row-pro-badge')
    expect(badge).toHaveTextContent('· Free access')
    expect(badge).not.toHaveTextContent('Business')
  })

  it('does not show the PRO pill without a plan', async () => {
    const requests = serveEntitlements({ [space.uuid]: null })
    render(<SpaceRow space={space} />, signedIn)

    await waitFor(() => expect(requests.count).toBe(1))
    expect(screen.queryByTestId('space-row-pro-badge')).not.toBeInTheDocument()
  })

  it('labels every row from one entitlements request', async () => {
    const otherSpace = { ...space, uuid: 'uuid-2', name: 'Other Space' } as GetSpaceResponse
    const requests = serveEntitlements({
      [space.uuid]: businessPlan('active'),
      [otherSpace.uuid]: businessPlan('trialing'),
    })
    render(
      <>
        <SpaceRow space={space} />
        <SpaceRow space={otherSpace} />
      </>,
      signedIn,
    )

    const badges = await screen.findAllByTestId('space-row-pro-badge')
    expect(badges.map((badge) => badge.textContent)).toEqual([
      expect.stringContaining('Business'),
      expect.stringContaining('Free access'),
    ])
    expect(requests.count).toBe(1)
  })

  it.each([
    ['Safe Pro is off', false, signedIn],
    ['the user is signed out', true, undefined],
  ])('does not request the entitlements when %s', async (_case, isSafePro, options) => {
    mockUseIsSafeProEnabled.mockReturnValue(isSafePro)
    const requests = serveEntitlements({ [space.uuid]: businessPlan('active') })
    render(<SpaceRow space={space} />, options)

    expect(await screen.findByText('My Space')).toBeInTheDocument()
    expect(requests.count).toBe(0)
    expect(screen.queryByTestId('space-row-pro-badge')).not.toBeInTheDocument()
  })

  it('tracks the workspace switch when the row is clicked', async () => {
    render(<SpaceRow space={space} />)

    await userEvent.click(screen.getByRole('link'))

    expect(trackEvent).toHaveBeenCalledWith(
      { ...SPACE_EVENTS.WORKSPACE_SWITCHED, label: space.uuid },
      {
        from_workspace_id: undefined,
        to_workspace_id: space.uuid,
        source: 'space_selector',
        safe_count: space.safeCount,
      },
    )
  })

  it('gives active admins a working context menu and members a disabled one', () => {
    const adminSpace = {
      ...space,
      members: [{ user: { id: 7 }, role: 'ADMIN', status: 'ACTIVE' }],
    } as unknown as GetSpaceResponse

    const { rerender } = render(<SpaceRow space={adminSpace} currentUserId={7} />)
    expect(screen.getByTestId('space-card-context-menu-button')).toBeInTheDocument()
    expect(screen.queryByTestId('space-row-locked-actions')).not.toBeInTheDocument()

    // A non-member (or non-admin) gets a disabled menu — the tooltip explains they need admin access.
    rerender(<SpaceRow space={adminSpace} currentUserId={8} />)
    expect(screen.queryByTestId('space-card-context-menu-button')).not.toBeInTheDocument()
    expect(screen.getByTestId('space-row-locked-actions')).toBeDisabled()
  })
})
