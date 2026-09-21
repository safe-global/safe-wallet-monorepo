import { render, screen } from '@/tests/test-utils'
import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import SpaceRow from '../SpaceRow'
import { AppRoutes } from '@/config/routes'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import userEvent from '@testing-library/user-event'

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

describe('SpaceRow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the workspace summary as a link into the workspace', () => {
    render(<SpaceRow space={space} />)

    expect(screen.getByText('My Space')).toBeInTheDocument()
    expect(screen.getByText(/2 Accounts/)).toBeInTheDocument()
    expect(screen.getByText(/3 Members/)).toBeInTheDocument()

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', `${AppRoutes.spaces.index}?spaceId=${space.uuid}`)
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
