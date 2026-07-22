import { render, screen } from '@testing-library/react'
import SpaceDashboard from '../index'
import { useLoadFeature } from '@/features/__core__'
import {
  useCurrentSpaceId,
  useSpaceSafes,
  useSpaceMembersByStatus,
  useIsInvited,
  useSpacePendingTransactions,
} from '@/features/spaces'
import { useSpaceAccountsData } from '@/features/myAccounts'
import type { ReactNode } from 'react'

jest.mock('next/router', () => ({
  useRouter: () => ({ push: jest.fn() }),
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

jest.mock('@/features/spaces', () => ({
  useSpaceSafes: jest.fn(),
  useCurrentSpaceId: jest.fn(),
  useSpaceMembersByStatus: jest.fn(),
  useIsInvited: jest.fn(),
  useTrackSpace: jest.fn(),
  useSpacePendingTransactions: jest.fn(),
  useGetSpaceAddressBook: jest.fn(() => []),
  SpacesFeature: { name: 'spaces' },
}))

jest.mock('@/features/myAccounts', () => ({
  MyAccountsFeature: { name: 'myAccounts' },
  useSpaceAccountsData: jest.fn(() => ({ accounts: [], isLoading: false, error: null, refetch: jest.fn() })),
}))

jest.mock('@/features/__core__', () => ({
  useLoadFeature: jest.fn(),
}))

jest.mock('@/services/local-storage/useLocalStorage', () => jest.fn(() => [{}, jest.fn()]))

jest.mock('@/hooks/safes', () => ({
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

jest.mock('@/features/spaces/components/AddAccountsChooser', () => ({
  __esModule: true,
  default: ({ buttonLabel, entryPoint }: { buttonLabel?: string; entryPoint?: string }) => (
    <button data-testid="add-accounts-chooser" data-entry-point={entryPoint}>
      {buttonLabel ?? 'Add accounts'}
    </button>
  ),
}))

const MOCK_SPACE_ID = '42'

const AccountsWidgetStub = (props: { onViewAll?: () => void; totalCount?: number; emptyStateAction?: ReactNode }) => (
  <div data-testid="accounts-widget">
    {props.onViewAll && (
      <button data-testid="view-all-slot" onClick={props.onViewAll}>
        View all {props.totalCount}
      </button>
    )}
    {props.emptyStateAction && <div data-testid="empty-state-action-slot">{props.emptyStateAction}</div>}
  </div>
)

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

const stubAccountsWidget = () => {
  ;(useLoadFeature as jest.Mock).mockImplementation((feature: { name: string }) => {
    if (feature.name === 'myAccounts') {
      return { AccountsWidget: AccountsWidgetStub, $isReady: true }
    }
    return { PendingTxWidget: () => null, $isReady: true }
  })
}

describe('SpaceDashboard – accounts widget header actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    stubAccountsWidget()
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
