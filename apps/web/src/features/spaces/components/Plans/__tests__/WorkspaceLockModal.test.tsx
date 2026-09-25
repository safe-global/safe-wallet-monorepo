import { fireEvent, render, screen } from '@/tests/test-utils'
import WorkspaceLockModal, { _memberCopy, _PLAN_ERROR_COPY } from '../WorkspaceLockModal'

const mockUseWorkspaceLock = jest.fn()
const mockUseCheckoutReturn = jest.fn()
jest.mock('../../../hooks/billing/useCheckoutReturn', () => ({
  useCheckoutReturn: (spaceId?: string) => mockUseCheckoutReturn(spaceId),
}))
const mockUseCurrentMembership = jest.fn()
const mockUseIsAdmin = jest.fn()
const mockPush = jest.fn()
let mockPathname = '/spaces'

jest.mock('next/router', () => ({ useRouter: () => ({ push: mockPush, pathname: mockPathname }) }))
jest.mock('../../../hooks/useWorkspaceLock', () => ({
  useWorkspaceLock: (spaceId?: string) => mockUseWorkspaceLock(spaceId),
}))
jest.mock('../../../hooks/useSpaceMembers', () => ({
  useCurrentMembership: (spaceId?: string) => mockUseCurrentMembership(spaceId),
  useIsAdmin: (spaceId?: string) => mockUseIsAdmin(spaceId),
}))
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useSpacesGetOneV1Query: () => ({ currentData: { name: 'Acme Inc' } }),
}))
jest.mock('../../SafeProModals', () => ({
  SafeProNoticeModal: ({
    title,
    body,
    onAction,
    secondaryActionLabel,
    secondaryActionHref,
    onSecondaryAction,
  }: {
    title: string
    body: string
    onAction: () => void
    secondaryActionLabel?: string
    secondaryActionHref?: string
    onSecondaryAction?: () => void
  }) => (
    <div data-testid="locked-member-modal">
      <h2>{title}</h2>
      <p>{body}</p>
      <button onClick={onAction}>Back to My accounts</button>
      {secondaryActionLabel && secondaryActionHref && <a href={secondaryActionHref}>{secondaryActionLabel}</a>}
      {secondaryActionLabel && onSecondaryAction && <button onClick={onSecondaryAction}>{secondaryActionLabel}</button>}
    </div>
  ),
}))
jest.mock('../ClaimTrialModal', () => ({
  __esModule: true,
  ...jest.requireActual('../ClaimTrialModal'),
  default: ({ spaceId, onBack }: { spaceId: string; onBack: () => void }) => (
    <button data-testid="claim-trial-modal" data-space={spaceId} onClick={onBack} />
  ),
}))
jest.mock('../PlanChooserModal', () => ({
  __esModule: true,
  ...jest.requireActual('../PlanChooserModal'),
  default: ({ reason, endedAt }: { reason: string; endedAt: number | null }) => (
    <div data-testid="plan-chooser-modal" data-reason={reason} data-ended={endedAt ?? ''} />
  ),
}))

const SPACE_ID = '11111111-1111-1111-1111-111111111111'
const ENDED_AT = Date.UTC(2026, 11, 5, 12)
const lock = (overrides: Record<string, unknown>) => ({
  isLocked: true,
  isResolving: false,
  isError: false,
  retry: jest.fn(),
  trialPeriodDays: 60,
  reason: 'trial-offered',
  endedAt: null,
  ...overrides,
})

describe('WorkspaceLockModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPathname = '/spaces'
    mockUseWorkspaceLock.mockReturnValue(lock({}))
    mockUseCurrentMembership.mockReturnValue({ id: 1 })
    mockUseIsAdmin.mockReturnValue(true)
    mockUseCheckoutReturn.mockReturnValue({ isReturning: false, status: 'idle' })
  })

  it('stays hidden while a Stripe return is still being confirmed, and comes back once it fails', () => {
    mockUseCheckoutReturn.mockReturnValue({ isReturning: true, status: 'activating' })
    expect(render(<WorkspaceLockModal spaceId={SPACE_ID} />).container).toBeEmptyDOMElement()

    mockUseCheckoutReturn.mockReturnValue({ isReturning: true, status: 'timeout' })
    render(<WorkspaceLockModal spaceId={SPACE_ID} />)
    expect(screen.getByTestId('claim-trial-modal')).toBeInTheDocument()
  })

  it('asks to try again instead of locking when the plan could not be checked, admin or not', () => {
    const retry = jest.fn()
    mockUseWorkspaceLock.mockReturnValue(lock({ isLocked: false, isError: true, retry }))
    mockUseIsAdmin.mockReturnValue(false)

    render(<WorkspaceLockModal spaceId={SPACE_ID} />)

    expect(screen.getByRole('heading', { name: _PLAN_ERROR_COPY.title })).toBeInTheDocument()
    expect(screen.queryByTestId('claim-trial-modal')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(retry).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Back to My accounts' }))
    expect(mockPush).toHaveBeenCalledWith('/welcome/accounts')
  })

  it('renders nothing for a Workspace with a live plan or before the membership is known', () => {
    mockUseWorkspaceLock.mockReturnValue(lock({ isLocked: false }))
    expect(render(<WorkspaceLockModal spaceId={SPACE_ID} />).container).toBeEmptyDOMElement()

    mockUseWorkspaceLock.mockReturnValue(lock({}))
    mockUseCurrentMembership.mockReturnValue(undefined)
    expect(render(<WorkspaceLockModal spaceId={SPACE_ID} />).container).toBeEmptyDOMElement()
  })

  it('offers the trial to an admin and returns to My accounts from it', () => {
    render(<WorkspaceLockModal spaceId={SPACE_ID} />)

    expect(mockUseWorkspaceLock).toHaveBeenCalledWith(SPACE_ID)
    expect(mockUseIsAdmin).toHaveBeenCalledWith(SPACE_ID)
    expect(screen.getByTestId('claim-trial-modal')).toHaveAttribute('data-space', SPACE_ID)

    fireEvent.click(screen.getByTestId('claim-trial-modal'))
    expect(mockPush).toHaveBeenCalledWith('/welcome/accounts')
  })

  it('shows the plan picker to an admin whose trial ended, on the Plans page too', () => {
    mockUseWorkspaceLock.mockReturnValue(lock({ trialPeriodDays: null, reason: 'lapsed', endedAt: ENDED_AT }))
    const { unmount } = render(<WorkspaceLockModal spaceId={SPACE_ID} />)

    expect(screen.getByTestId('plan-chooser-modal')).toHaveAttribute('data-reason', 'lapsed')
    expect(screen.getByTestId('plan-chooser-modal')).toHaveAttribute('data-ended', String(ENDED_AT))
    unmount()

    mockPathname = '/spaces/plans'
    render(<WorkspaceLockModal spaceId={SPACE_ID} />)
    expect(screen.getByTestId('plan-chooser-modal')).toBeInTheDocument()
  })

  it('only explains the lock to a non-admin member', () => {
    mockUseIsAdmin.mockReturnValue(false)
    render(<WorkspaceLockModal spaceId={SPACE_ID} />)

    expect(screen.getByTestId('locked-member-modal')).toHaveTextContent(
      'Your Workspace moved to Safe Pro on Oct 6, 2026',
    )
    expect(screen.getByTestId('locked-member-modal')).toHaveTextContent(
      'Acme Inc is locked until an admin starts the free access.',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Back to My accounts' }))
    expect(mockPush).toHaveBeenCalledWith('/welcome/accounts')
  })

  it('words the member explanation by lock reason', () => {
    expect(_memberCopy('lapsed', null, ENDED_AT, 'Acme Inc')).toEqual({
      title: 'Your Safe Pro free access ended on Dec 5, 2026',
      body: 'An admin needs to choose a plan to unlock it. Your Safe accounts remain available outside the Workspace.',
    })
    expect(_memberCopy('payment-failed', null, null, 'Acme Inc').title).toBe('Your Workspace’s last payment failed')
    expect(_memberCopy('trial-offered', 30, null, 'Acme Inc').title).toBe('Start your 30-day free access to Safe Pro')
  })
})
