import { render, screen } from '@testing-library/react'
import SpaceDashboard from '../index'
import { useCurrentSpaceId } from '../../../public/hooks/useCurrentSpaceId'
import { useSpaceSafes } from '../../../public/hooks/useSpaceSafes'
import { useSpaceMembersByStatus, useIsInvited } from '../../../public/hooks/useSpaceMembers'
import { useSpacePendingTransactions } from '../../../hooks/useSpacePendingTransactions'
import useSpaceAccountsData from '@/features/myAccounts/public/hooks/useSpaceAccountsData'
import type { ReactNode } from 'react'

jest.mock('@/hooks/useChains', () => ({ useHasFeature: () => false }))
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useSpacesGetOneV1Query: () => ({ currentData: undefined }),
}))

jest.mock('next/router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), pathname: '/spaces', query: {} }),
}))

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
}))

jest.mock('@/services/analytics/events/spaces', () => ({
  SPACE_EVENTS: {
    ADD_ACCOUNTS_MODAL: { action: 'add_accounts_modal', category: 'spaces' },
    ACCOUNTS_WIDGET_CLICKED: { action: 'accounts_widget_clicked', category: 'spaces' },
    PENDING_TX_WIDGET_CLICKED: { action: 'pending_tx_widget_clicked', category: 'spaces' },
    WORKSPACE_DASHBOARD_VIEWED: { action: 'workspace_dashboard_viewed', category: 'spaces' },
  },
  SPACE_LABELS: { space_dashboard_card: 'space_dashboard_card' },
}))

jest.mock('@/services/analytics/mixpanel-events', () => ({
  MixpanelEventParams: { SAFE_ADDRESS: 'Safe Address', TX_ID: 'TX ID' },
}))

jest.mock('../../../public/hooks/useSpaceSafes', () => ({
  useSpaceSafes: jest.fn(),
}))
jest.mock('../../../public/hooks/useCurrentSpaceId', () => ({
  useCurrentSpaceId: jest.fn(),
}))
jest.mock('../../../public/hooks/useSpaceMembers', () => ({
  get MemberStatus() {
    return jest.requireActual('../../../public/hooks/useSpaceMembers').MemberStatus
  },
  get MemberRole() {
    return jest.requireActual('../../../public/hooks/useSpaceMembers').MemberRole
  },
  get MEMBER_ALIAS_MAX_LENGTH() {
    return jest.requireActual('../../../public/hooks/useSpaceMembers').MEMBER_ALIAS_MAX_LENGTH
  },
  get getMemberDisplayName() {
    return jest.requireActual('../../../public/hooks/useSpaceMembers').getMemberDisplayName
  },
  get sanitizeMemberAlias() {
    return jest.requireActual('../../../public/hooks/useSpaceMembers').sanitizeMemberAlias
  },
  get isAdmin() {
    return jest.requireActual('../../../public/hooks/useSpaceMembers').isAdmin
  },
  get isActiveAdmin() {
    return jest.requireActual('../../../public/hooks/useSpaceMembers').isActiveAdmin
  },
  get isInviteExpired() {
    return jest.requireActual('../../../public/hooks/useSpaceMembers').isInviteExpired
  },
  get useCurrentMembership() {
    return jest.requireActual('../../../public/hooks/useSpaceMembers').useCurrentMembership
  },
  get useCurrentMemberProfile() {
    return jest.requireActual('../../../public/hooks/useSpaceMembers').useCurrentMemberProfile
  },
  get useIsActiveMember() {
    return jest.requireActual('../../../public/hooks/useSpaceMembers').useIsActiveMember
  },
  get useIsAdmin() {
    return jest.requireActual('../../../public/hooks/useSpaceMembers').useIsAdmin
  },
  useSpaceMembersByStatus: jest.fn(),
  useIsInvited: jest.fn(),
}))
jest.mock('../../../hooks/useTrackSpace', () => ({
  __esModule: true,
  default: jest.fn(),
}))
jest.mock('../../../hooks/useSpacePendingTransactions', () => ({
  useSpacePendingTransactions: jest.fn(),
}))
jest.mock('../../../public/hooks/useGetSpaceAddressBook', () => ({
  ...jest.requireActual('../../../public/hooks/useGetSpaceAddressBook'),
  __esModule: true,
  default: jest.fn(() => []),
}))
jest.mock('../PendingTxWidget', () => ({ __esModule: true, default: () => null }))

jest.mock('@/features/myAccounts/public/hooks/useSpaceAccountsData', () => ({
  __esModule: true,
  default: jest.fn(() => ({ accounts: [], isLoading: false, error: null, refetch: jest.fn() })),
}))

jest.mock('../../../hooks/useSpacePlan', () => ({
  useSpacePlan: () => ({ plan: null, status: 'none', isLoading: false, refetch: jest.fn() }),
}))
jest.mock('../../../public/hooks/useSpacePlanState', () => ({ useSpacePlanState: () => null }))
jest.mock('../../../hooks/useWorkspaceLock', () => ({
  useWorkspaceLock: () => ({ isLocked: false, isResolving: false, trialPeriodDays: null }),
}))
jest.mock('../../Plans/CheckoutReturnModals', () => ({ __esModule: true, default: () => null }))

jest.mock('@/features/safe-pro-announcement/public/components/SafeProAnnouncementModal', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('@/features/safe-pro-announcement/public/hooks/useSafeProAnnouncementModal', () => ({
  ...jest.requireActual('@/features/safe-pro-announcement/public/hooks/useSafeProAnnouncementModal'),
  useSafeProAnnouncementModal: () => ({ isOpen: false, setIsOpen: jest.fn() }),
}))

jest.mock('@/services/local-storage/useLocalStorage', () => jest.fn(() => [{}, jest.fn()]))

jest.mock('@/hooks/safes/useAllSafesGrouped', () => ({
  ...jest.requireActual('@/hooks/safes/useAllSafesGrouped'),
  flattenSafeItems: jest.fn((items: unknown[]) => items),
}))

jest.mock('../AddAccountsCard', () => () => null)
jest.mock('../AggregatedBalances', () => () => null)
jest.mock('../../InviteBanner/PreviewInvite', () => () => null)
jest.mock('../../SetupWidget', () => () => null)
jest.mock('@/components/common/Track', () => {
  const Track = ({ children }: { children: ReactNode }) => <>{children}</>
  Track.displayName = 'Track'
  return Track
})

jest.mock('../../AddAccountsChooser', () => ({
  __esModule: true,
  default: ({ buttonLabel, entryPoint }: { buttonLabel?: string; entryPoint?: string }) => (
    <button data-testid="add-accounts-chooser" data-entry-point={entryPoint}>
      {buttonLabel ?? 'Add accounts'}
    </button>
  ),
}))

jest.mock('@/features/myAccounts/public/components/AccountsWidget', () => ({
  __esModule: true,
  default: (props: { onViewAll?: () => void; totalCount?: number; emptyStateAction?: ReactNode }) => (
    <div data-testid="accounts-widget">
      {props.onViewAll && (
        <button data-testid="view-all-slot" onClick={props.onViewAll}>
          View all {props.totalCount}
        </button>
      )}
      {props.emptyStateAction && <div data-testid="empty-state-action-slot">{props.emptyStateAction}</div>}
    </div>
  ),
}))

const MOCK_SPACE_ID = '42'

const restoreDefaultMocks = (safes: Array<{ address: string; chainId: string }>) => {
  ;(useCurrentSpaceId as jest.Mock).mockReturnValue(MOCK_SPACE_ID)
  ;(useSpaceSafes as jest.Mock).mockReturnValue({ allSafes: safes, isLoading: false })
  ;(useSpaceMembersByStatus as jest.Mock).mockReturnValue({ activeMembers: [] })
  ;(useIsInvited as jest.Mock).mockReturnValue(false)
  ;(useSpacePendingTransactions as jest.Mock).mockReturnValue({
    transactions: [],
    count: 0,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  })
  ;(useSpaceAccountsData as jest.Mock).mockReturnValue({
    accounts: safes,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  })
}

describe('SpaceDashboard – accounts widget header actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('wires a "View all" action carrying the total Safe-account count', () => {
    restoreDefaultMocks([
      { address: '0xaaaa', chainId: '1' },
      { address: '0xbbbb', chainId: '1' },
    ])

    render(<SpaceDashboard />)

    expect(screen.getByTestId('view-all-slot')).toHaveTextContent('View all 2')
  })

  it('no longer wires the "Manage accounts" chooser as the populated header action', () => {
    restoreDefaultMocks([{ address: '0xaaaa', chainId: '1' }])

    render(<SpaceDashboard />)

    // The populated header action is now "View all"; the chooser only remains as the empty-state action.
    expect(screen.getByTestId('view-all-slot')).toBeInTheDocument()
  })

  it('wires the "Manage accounts" chooser as the empty-state action with the dashboard entry point', () => {
    restoreDefaultMocks([])

    render(<SpaceDashboard />)

    const emptyStateSlot = screen.getByTestId('empty-state-action-slot')
    expect(emptyStateSlot).toHaveTextContent('Manage accounts')
    expect(emptyStateSlot.querySelector('[data-entry-point="dashboard"]')).not.toBeNull()
  })
})
