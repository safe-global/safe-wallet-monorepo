import { render, screen, fireEvent } from '@testing-library/react'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { useLoadFeature } from '@/features/__core__'
import SpaceDashboard from '../index'

const MOCK_SPACE_ID = 'space-42'
const MOCK_SAFE_ADDRESS = '0xaaaa567890abcdef1234567890abcdef12345678'
const MOCK_TX_ID = 'multisig_0xbbbb_123'

// ---- Module mocks ----

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
  useSpaceSafes: jest.fn(() => ({ allSafes: [{ address: MOCK_SAFE_ADDRESS, chainId: '1' }] })),
  useCurrentSpaceId: jest.fn(() => MOCK_SPACE_ID),
  useSpaceMembersByStatus: jest.fn(() => ({ activeMembers: [] })),
  useIsInvited: jest.fn(() => false),
  useTrackSpace: jest.fn(),
  useSpacePendingTransactions: jest.fn(() => ({
    transactions: [],
    count: 0,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  })),
  SpacesFeature: { name: 'spaces' },
}))

jest.mock('@/features/myAccounts', () => ({
  MyAccountsFeature: { name: 'myAccounts' },
  useSpaceAccountsData: jest.fn(() => ({ accounts: [], isLoading: false, error: null, refetch: jest.fn() })),
}))

jest.mock('@/features/__core__', () => ({
  useLoadFeature: jest.fn(),
}))

jest.mock('@/hooks/safes', () => ({
  flattenSafeItems: jest.fn((items: unknown[]) => items),
}))

// Stub sub-components irrelevant to tracking
jest.mock('../MembersCard', () => () => null)
jest.mock('../SpacesCTACard', () => () => null)
jest.mock('../ImportAddressBookCard', () => () => null)
jest.mock('../AddAccountsCard', () => () => null)
jest.mock('../AggregatedBalances', () => () => null)
jest.mock('../../InviteBanner/PreviewInvite', () => () => null)
jest.mock('@/features/spaces/components/AddAccounts', () => () => null)
jest.mock('@/components/common/Track', () => ({ children }: { children: React.ReactNode }) => <>{children}</>)

// ---- Helpers ----

/** A minimal PendingTxWidget stub that exposes one clickable row per tx entry */
const makeMockPendingTxWidget =
  (txEntries: Array<{ safeAddress: string; txId: string }>) =>
  ({ onItemClick }: { onItemClick?: (safeAddress: string, txId: string) => void }) => (
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

function setupUseLoadFeature(txEntries: Array<{ safeAddress: string; txId: string }> = []) {
  ;(useLoadFeature as jest.Mock).mockReturnValue({
    PendingTxWidget: makeMockPendingTxWidget(txEntries),
    AccountsWidget: () => null,
    $isReady: true,
  })
}

// ---- Tests ----

describe('SpaceDashboard – PENDING_TX_WIDGET_CLICKED tracking', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setupUseLoadFeature([{ safeAddress: MOCK_SAFE_ADDRESS, txId: MOCK_TX_ID }])
  })

  it('fires trackEvent exactly once when a pending tx row is clicked', () => {
    render(<SpaceDashboard />)
    fireEvent.click(screen.getByTestId(`pending-tx-row-${MOCK_TX_ID}`))

    expect(trackEvent).toHaveBeenCalledTimes(1)
  })

  it('does not fire trackEvent before any row is clicked', () => {
    render(<SpaceDashboard />)

    expect(trackEvent).not.toHaveBeenCalled()
  })

  it('does not fire trackEvent on re-renders without a click', () => {
    const { rerender } = render(<SpaceDashboard />)
    rerender(<SpaceDashboard />)

    expect(trackEvent).not.toHaveBeenCalled()
  })

  it('fires trackEvent with the correct GA parameters (event action + spaceId as label)', () => {
    render(<SpaceDashboard />)
    fireEvent.click(screen.getByTestId(`pending-tx-row-${MOCK_TX_ID}`))

    expect(trackEvent).toHaveBeenCalledWith(
      { ...SPACE_EVENTS.PENDING_TX_WIDGET_CLICKED, label: MOCK_SPACE_ID },
      expect.anything(),
    )
  })

  it('fires trackEvent with the correct Mixpanel parameters (spaceId, safeAddress, txId)', () => {
    render(<SpaceDashboard />)
    fireEvent.click(screen.getByTestId(`pending-tx-row-${MOCK_TX_ID}`))

    expect(trackEvent).toHaveBeenCalledWith(expect.anything(), {
      spaceId: MOCK_SPACE_ID,
      [MixpanelEventParams.SAFE_ADDRESS]: MOCK_SAFE_ADDRESS,
      [MixpanelEventParams.TX_ID]: MOCK_TX_ID,
    })
  })

  it('fires trackEvent with the full correct signature – GA label + Mixpanel params', () => {
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

    expect(trackEvent).toHaveBeenCalledTimes(2)
    expect(trackEvent).toHaveBeenNthCalledWith(
      1,
      { ...SPACE_EVENTS.PENDING_TX_WIDGET_CLICKED, label: MOCK_SPACE_ID },
      {
        spaceId: MOCK_SPACE_ID,
        [MixpanelEventParams.SAFE_ADDRESS]: MOCK_SAFE_ADDRESS,
        [MixpanelEventParams.TX_ID]: MOCK_TX_ID,
      },
    )
    expect(trackEvent).toHaveBeenNthCalledWith(
      2,
      { ...SPACE_EVENTS.PENDING_TX_WIDGET_CLICKED, label: MOCK_SPACE_ID },
      {
        spaceId: MOCK_SPACE_ID,
        [MixpanelEventParams.SAFE_ADDRESS]: secondSafeAddress,
        [MixpanelEventParams.TX_ID]: secondTxId,
      },
    )
  })
})
