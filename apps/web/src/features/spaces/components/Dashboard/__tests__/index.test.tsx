import { render, screen, fireEvent } from '@testing-library/react'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { useLoadFeature } from '@/features/__core__'
import {
  useCurrentSpaceId,
  useSpaceSafes,
  useSpaceMembersByStatus,
  useIsInvited,
  useSpacePendingTransactions,
} from '@/features/spaces'
import { useSpaceAccountsData } from '@/features/myAccounts'
import SpaceDashboard from '../index'

const MOCK_SPACE_ID = '42'
const MOCK_SAFE_ADDRESS = '0xaaaa567890abcdef1234567890abcdef12345678'
const MOCK_TX_ID = 'multisig_0xbbbb_123'

// ---- Module mocks ----

// Cut the DialogActions -> CheckWallet -> safeCoreSDK -> chains.ts import chain (circular AppRoutes) in unit tests.
jest.mock('@/components/common/CheckWallet', () => ({
  __esModule: true,
  default: ({ children }: { children: (ok: boolean) => unknown }) => children(true),
}))

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
  MixpanelEventParams: {
    SAFE_ADDRESS: 'Safe Address',
    TX_ID: 'TX ID',
  },
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

// Stub sub-components irrelevant to tracking
jest.mock('../AddAccountsCard', () => () => null)
jest.mock('../AggregatedBalances', () => () => null)
jest.mock('../../InviteBanner/PreviewInvite', () => () => null)
jest.mock('@/features/spaces/components/AddAccounts', () => () => null)
jest.mock('../../SetupWidget', () => () => null)
jest.mock('@/components/common/Track', () => {
  const Track = ({ children }: { children: React.ReactNode }) => <>{children}</>
  Track.displayName = 'Track'
  return Track
})

// ---- Helpers ----

/** A minimal PendingTxWidget stub that exposes one clickable row per tx entry */
const makeMockPendingTxWidget = (txEntries: Array<{ safeAddress: string; txId: string }>) => {
  const MockPendingTxWidget = ({ onItemClick }: { onItemClick?: (safeAddress: string, txId: string) => void }) => (
    <>
      {txEntries.map(({ safeAddress, txId }) => (
        <div
          key={txId}
          data-testid={`pending-tx-row-${txId}`}
          role="button"
          onClick={() => onItemClick?.(safeAddress, txId)}
        >
          Pending Tx {txId}
        </div>
      ))}
    </>
  )
  MockPendingTxWidget.displayName = 'MockPendingTxWidget'
  return MockPendingTxWidget
}

function setupUseLoadFeature(txEntries: Array<{ safeAddress: string; txId: string }> = []) {
  ;(useLoadFeature as jest.Mock).mockReturnValue({
    PendingTxWidget: makeMockPendingTxWidget(txEntries),
    AccountsWidget: () => null,
    $isReady: true,
  })
}

const getCallsForEvent = (action: string) =>
  (trackEvent as jest.Mock).mock.calls.filter(([event]) => event.action === action)

const restoreDefaultMocks = () => {
  const useCurrentSpaceIdMock = useCurrentSpaceId as jest.Mock
  const useSpaceSafesMock = useSpaceSafes as jest.Mock
  const useSpaceMembersByStatusMock = useSpaceMembersByStatus as jest.Mock
  const useIsInvitedMock = useIsInvited as jest.Mock
  const useSpacePendingTransactionsMock = useSpacePendingTransactions as jest.Mock
  const useSpaceAccountsDataMock = useSpaceAccountsData as jest.Mock

  useCurrentSpaceIdMock.mockReturnValue(MOCK_SPACE_ID)
  useSpaceSafesMock.mockReturnValue({ allSafes: [{ address: MOCK_SAFE_ADDRESS, chainId: '1' }], isLoading: false })
  useSpaceMembersByStatusMock.mockReturnValue({ activeMembers: [] })
  useIsInvitedMock.mockReturnValue(false)
  useSpacePendingTransactionsMock.mockReturnValue({
    transactions: [],
    count: 0,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  })
  useSpaceAccountsDataMock.mockReturnValue({ accounts: [], isLoading: false, error: null, refetch: jest.fn() })
}

// ---- Tests ----

describe('SpaceDashboard – WORKSPACE_DASHBOARD_VIEWED tracking', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    restoreDefaultMocks()
    setupUseLoadFeature()
  })

  it('fires WORKSPACE_DASHBOARD_VIEWED once on mount', () => {
    render(<SpaceDashboard />)

    const calls = getCallsForEvent(SPACE_EVENTS.WORKSPACE_DASHBOARD_VIEWED.action)
    expect(calls).toHaveLength(1)
  })

  it('fires WORKSPACE_DASHBOARD_VIEWED with spaceId as GA label', () => {
    render(<SpaceDashboard />)

    expect(trackEvent).toHaveBeenCalledWith(
      { ...SPACE_EVENTS.WORKSPACE_DASHBOARD_VIEWED, label: MOCK_SPACE_ID },
      expect.anything(),
    )
  })

  it('fires WORKSPACE_DASHBOARD_VIEWED with workspace_id and counts as Mixpanel params', () => {
    render(<SpaceDashboard />)

    expect(trackEvent).toHaveBeenCalledWith(expect.anything(), {
      workspace_id: MOCK_SPACE_ID,
      pending_tx_count: 0,
      member_count: 0,
      safe_count: 1,
    })
  })

  it('fires WORKSPACE_DASHBOARD_VIEWED with full correct signature', () => {
    render(<SpaceDashboard />)

    expect(trackEvent).toHaveBeenCalledWith(
      { ...SPACE_EVENTS.WORKSPACE_DASHBOARD_VIEWED, label: MOCK_SPACE_ID },
      { workspace_id: MOCK_SPACE_ID, pending_tx_count: 0, member_count: 0, safe_count: 1 },
    )
  })

  it('does not fire WORKSPACE_DASHBOARD_VIEWED when spaceId is not yet available', () => {
    ;(useCurrentSpaceId as jest.Mock).mockReturnValue(null)

    render(<SpaceDashboard />)

    const calls = getCallsForEvent(SPACE_EVENTS.WORKSPACE_DASHBOARD_VIEWED.action)
    expect(calls).toHaveLength(0)
  })

  it('does not fire WORKSPACE_DASHBOARD_VIEWED again on re-render with the same spaceId', () => {
    const { rerender } = render(<SpaceDashboard />)
    rerender(<SpaceDashboard />)

    const calls = getCallsForEvent(SPACE_EVENTS.WORKSPACE_DASHBOARD_VIEWED.action)
    expect(calls).toHaveLength(1)
  })

  it('fires WORKSPACE_DASHBOARD_VIEWED exactly once more when spaceId changes, with the new spaceId', () => {
    const spaceIdMock = useCurrentSpaceId as jest.Mock
    const { rerender } = render(<SpaceDashboard />)

    spaceIdMock.mockReturnValue('99')
    rerender(<SpaceDashboard />)

    const calls = getCallsForEvent(SPACE_EVENTS.WORKSPACE_DASHBOARD_VIEWED.action)
    expect(calls).toHaveLength(2)
    expect(calls[0]).toEqual([
      { ...SPACE_EVENTS.WORKSPACE_DASHBOARD_VIEWED, label: MOCK_SPACE_ID },
      { workspace_id: MOCK_SPACE_ID, pending_tx_count: 0, member_count: 0, safe_count: 1 },
    ])
    expect(calls[1]).toEqual([
      { ...SPACE_EVENTS.WORKSPACE_DASHBOARD_VIEWED, label: '99' },
      { workspace_id: '99', pending_tx_count: 0, member_count: 0, safe_count: 1 },
    ])
  })
})

describe('SpaceDashboard – PENDING_TX_WIDGET_CLICKED tracking', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    restoreDefaultMocks()
    setupUseLoadFeature([{ safeAddress: MOCK_SAFE_ADDRESS, txId: MOCK_TX_ID }])
  })

  it('fires PENDING_TX_WIDGET_CLICKED exactly once when a pending tx row is clicked', () => {
    render(<SpaceDashboard />)
    fireEvent.click(screen.getByTestId(`pending-tx-row-${MOCK_TX_ID}`))

    const calls = getCallsForEvent(SPACE_EVENTS.PENDING_TX_WIDGET_CLICKED.action)
    expect(calls).toHaveLength(1)
  })

  it('does not fire PENDING_TX_WIDGET_CLICKED before any row is clicked', () => {
    render(<SpaceDashboard />)

    const calls = getCallsForEvent(SPACE_EVENTS.PENDING_TX_WIDGET_CLICKED.action)
    expect(calls).toHaveLength(0)
  })

  it('does not fire PENDING_TX_WIDGET_CLICKED on re-renders without a click', () => {
    const { rerender } = render(<SpaceDashboard />)
    rerender(<SpaceDashboard />)

    const calls = getCallsForEvent(SPACE_EVENTS.PENDING_TX_WIDGET_CLICKED.action)
    expect(calls).toHaveLength(0)
  })

  it('fires PENDING_TX_WIDGET_CLICKED with the correct GA parameters (event action + spaceId as label)', () => {
    render(<SpaceDashboard />)
    fireEvent.click(screen.getByTestId(`pending-tx-row-${MOCK_TX_ID}`))

    expect(trackEvent).toHaveBeenCalledWith(
      { ...SPACE_EVENTS.PENDING_TX_WIDGET_CLICKED, label: MOCK_SPACE_ID },
      expect.anything(),
    )
  })

  it('fires PENDING_TX_WIDGET_CLICKED with the correct Mixpanel parameters (spaceId, safeAddress, txId)', () => {
    render(<SpaceDashboard />)
    fireEvent.click(screen.getByTestId(`pending-tx-row-${MOCK_TX_ID}`))

    expect(trackEvent).toHaveBeenCalledWith(expect.anything(), {
      spaceId: MOCK_SPACE_ID,
      [MixpanelEventParams.SAFE_ADDRESS]: MOCK_SAFE_ADDRESS,
      [MixpanelEventParams.TX_ID]: MOCK_TX_ID,
    })
  })

  it('fires PENDING_TX_WIDGET_CLICKED with full correct signature – GA label + Mixpanel params', () => {
    render(<SpaceDashboard />)
    fireEvent.click(screen.getByTestId(`pending-tx-row-${MOCK_TX_ID}`))

    expect(trackEvent).toHaveBeenCalledWith(
      { ...SPACE_EVENTS.PENDING_TX_WIDGET_CLICKED, label: MOCK_SPACE_ID },
      {
        spaceId: MOCK_SPACE_ID,
        [MixpanelEventParams.SAFE_ADDRESS]: MOCK_SAFE_ADDRESS,
        [MixpanelEventParams.TX_ID]: MOCK_TX_ID,
      },
    )
  })

  it('fires a separate event for each distinct row clicked, with correct per-row params', () => {
    const secondTxId = 'multisig_0xcccc_456'
    const secondSafeAddress = '0xdddd567890abcdef1234567890abcdef12345678'
    setupUseLoadFeature([
      { safeAddress: MOCK_SAFE_ADDRESS, txId: MOCK_TX_ID },
      { safeAddress: secondSafeAddress, txId: secondTxId },
    ])

    render(<SpaceDashboard />)

    fireEvent.click(screen.getByTestId(`pending-tx-row-${MOCK_TX_ID}`))
    fireEvent.click(screen.getByTestId(`pending-tx-row-${secondTxId}`))

    const calls = getCallsForEvent(SPACE_EVENTS.PENDING_TX_WIDGET_CLICKED.action)
    expect(calls).toHaveLength(2)
    expect(calls[0]).toEqual([
      { ...SPACE_EVENTS.PENDING_TX_WIDGET_CLICKED, label: MOCK_SPACE_ID },
      {
        spaceId: MOCK_SPACE_ID,
        [MixpanelEventParams.SAFE_ADDRESS]: MOCK_SAFE_ADDRESS,
        [MixpanelEventParams.TX_ID]: MOCK_TX_ID,
      },
    ])
    expect(calls[1]).toEqual([
      { ...SPACE_EVENTS.PENDING_TX_WIDGET_CLICKED, label: MOCK_SPACE_ID },
      {
        spaceId: MOCK_SPACE_ID,
        [MixpanelEventParams.SAFE_ADDRESS]: secondSafeAddress,
        [MixpanelEventParams.TX_ID]: secondTxId,
      },
    ])
  })
})
