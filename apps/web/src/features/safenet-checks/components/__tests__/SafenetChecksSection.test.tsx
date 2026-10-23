import { renderWithUserEvent, screen } from '@/tests/test-utils'
import { TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { DetailedExecutionInfoType } from '@safe-global/store/gateway/types'
import { CheckStatus, type PublicCheckStatus } from '@safe-global/utils/features/safenet-checks'
import { useSafenetCheck } from '@safe-global/utils/features/safenet-checks/hooks'
import {
  buildCheckView,
  buildSnapshot,
  sentinelRevealedEvent,
} from '@safe-global/utils/features/safenet-checks/builders'
import { SafenetChecksSection } from '../SafenetChecksSection'

jest.mock('@safe-global/utils/features/safenet-checks/hooks', () => ({
  ...jest.requireActual('@safe-global/utils/features/safenet-checks/hooks'),
  useSafenetCheck: jest.fn(),
}))

const mockUseSafenetCheck = useSafenetCheck as jest.MockedFunction<typeof useSafenetCheck>

const HASH = `0x${'cd'.repeat(32)}`
const SAFE = '0x0000000000000000000000000000000000000123'
const TX_ID = `multisig_${SAFE}_${HASH}`
const SUBMITTED_AT = 1_700_000_000_000

const txDetails = {
  detailedExecutionInfo: {
    type: DetailedExecutionInfoType.MULTISIG,
    submittedAt: SUBMITTED_AT,
  },
} as unknown as TransactionDetails

const renderInFlow = (flow: Partial<TxFlowContextType>, locked = false) =>
  renderWithUserEvent(
    <TxFlowContext.Provider value={flow as TxFlowContextType}>
      <SafenetChecksSection locked={locked} />
    </TxFlowContext.Provider>,
  )

describe('SafenetChecksSection', () => {
  beforeEach(() => jest.clearAllMocks())

  it('subscribes with the hash from the flow txId and the submission time', () => {
    mockUseSafenetCheck.mockReturnValue(buildCheckView())

    renderInFlow({ txId: TX_ID, txDetails })

    expect(mockUseSafenetCheck).toHaveBeenCalledWith(
      HASH,
      SUBMITTED_AT,
      expect.objectContaining({ chainId: expect.any(String) }),
    )
  })

  it('renders nothing for a creation flow (no txId, no canonical hash)', () => {
    mockUseSafenetCheck.mockReturnValue(buildCheckView())

    const { container } = renderInFlow({})

    expect(mockUseSafenetCheck).toHaveBeenCalledWith(
      undefined,
      undefined,
      expect.objectContaining({ chainId: expect.any(String) }),
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('never subscribes before the submission time is known (nothing else aims the shared read)', () => {
    mockUseSafenetCheck.mockReturnValue(buildCheckView())

    const { container } = renderInFlow({ txId: TX_ID })

    expect(mockUseSafenetCheck).toHaveBeenCalledWith(
      undefined,
      undefined,
      expect.objectContaining({ chainId: expect.any(String) }),
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing while the first read is still in flight', () => {
    mockUseSafenetCheck.mockReturnValue(buildCheckView({ isLoading: true, isFetching: true }))

    const { container } = renderInFlow({ txId: TX_ID, txDetails })

    expect(container).toBeEmptyDOMElement()
  })

  it('renders the no-check copy when no check was requested', () => {
    const snapshot = buildSnapshot({
      safeTxHash: HASH as `0x${string}`,
      status: CheckStatus.UNAVAILABLE,
      windowCoverage: 'proven',
    })
    mockUseSafenetCheck.mockReturnValue(
      buildCheckView({
        snapshot,
        status: CheckStatus.UNAVAILABLE,
        publicStatus: CheckStatus.UNAVAILABLE,
        unavailableReason: 'NO_CHECK',
      }),
    )

    renderInFlow({ txId: TX_ID, txDetails })

    const section = screen.getByTestId('safenet-checks-section')
    expect(section).toHaveAttribute('data-reason', 'NO_CHECK')
    expect(section).toHaveTextContent('Not checked')
    expect(section).toHaveTextContent('No Safenet check was requested for this transaction.')
  })

  it('never claims an absent check when the read window could not cover one', () => {
    const snapshot = buildSnapshot({
      safeTxHash: HASH as `0x${string}`,
      status: CheckStatus.UNAVAILABLE,
      windowCoverage: 'heuristic',
    })
    mockUseSafenetCheck.mockReturnValue(
      buildCheckView({
        snapshot,
        status: CheckStatus.UNAVAILABLE,
        publicStatus: CheckStatus.UNAVAILABLE,
        unavailableReason: 'WINDOW_UNCERTAIN',
      }),
    )

    renderInFlow({ txId: TX_ID, txDetails })

    const section = screen.getByTestId('safenet-checks-section')
    expect(section).toHaveAttribute('data-reason', 'WINDOW_UNCERTAIN')
    expect(section).toHaveTextContent('Safenet status unknown')
    expect(section).not.toHaveTextContent('No Safenet check was requested')
  })

  it('renders the read-failed copy when the status could not be read', () => {
    mockUseSafenetCheck.mockReturnValue(
      buildCheckView({
        status: CheckStatus.UNAVAILABLE,
        publicStatus: CheckStatus.UNAVAILABLE,
        unavailableReason: 'READ_FAILED',
      }),
    )

    renderInFlow({ txId: TX_ID, txDetails })

    const section = screen.getByTestId('safenet-checks-section')
    expect(section).toHaveAttribute('data-reason', 'READ_FAILED')
    expect(section).toHaveTextContent("Couldn't read Safenet status")
  })

  it.each<[Exclude<PublicCheckStatus, CheckStatus.UNAVAILABLE>, string]>([
    [CheckStatus.SUBMITTED, 'Check submitted to Safenet.'],
    [CheckStatus.IN_PROGRESS, 'Safenet is simulating this transaction.'],
    [CheckStatus.BENIGN, 'Safenet found no issues'],
    [CheckStatus.MALICIOUS, 'Safenet flagged this address/transaction as malicious'],
    [
      CheckStatus.DISPUTED,
      'A sentinel flagged this transaction, and the dispute is open. Safenet will publish a final ruling.',
    ],
    [CheckStatus.TIMED_OUT, 'Safenet check is unavailable. You can still continue.'],
  ])('renders %s copy', (status, copy) => {
    const snapshot = buildSnapshot({ safeTxHash: HASH as `0x${string}`, status })
    mockUseSafenetCheck.mockReturnValue(buildCheckView({ snapshot, status, publicStatus: status }))

    renderInFlow({ txId: TX_ID, txDetails })

    const section = screen.getByTestId('safenet-checks-section')
    expect(section).toHaveAttribute('data-status', status)
    expect(section).toHaveTextContent(copy)
  })

  const renderRisk = (reasons: string[]) => {
    const events = reasons.map((reason) => sentinelRevealedEvent({ approved: false, reason }))
    const snapshot = buildSnapshot({ safeTxHash: HASH as `0x${string}`, status: CheckStatus.MALICIOUS, events })
    mockUseSafenetCheck.mockReturnValue(
      buildCheckView({ snapshot, status: CheckStatus.MALICIOUS, publicStatus: CheckStatus.MALICIOUS }),
    )
    renderInFlow({ txId: TX_ID, txDetails })
    return screen.getByTestId('safenet-rejection-rules')
  }

  it('shows the cited rules, most-cited first, and the sentinel tally below them in one card', () => {
    const card = renderRisk(['R-4.4', 'R-4.5', 'R-4.5'])

    expect(screen.getByRole('status')).toHaveTextContent('Risks detected')
    const text = card.textContent ?? ''
    expect(text.indexOf('Unlimited approval')).toBeLessThan(text.indexOf('Unknown spender'))
    expect(text.indexOf('Unknown spender')).toBeLessThan(text.indexOf('3 of 3 sentinels flagged this.'))
    expect(screen.getAllByTestId('safenet-flagged-count')).toHaveLength(1)
  })

  it.each([
    ['R-4.1', 'var(--color-warning-main)'],
    ['R-4.5', 'var(--color-warning-main)'],
    ['R-4.6', 'var(--color-error-main)'],
  ])('colors a risk citing %s with %s', (reason, color) => {
    const card = renderRisk([reason])

    expect((card.closest('[style]') as HTMLElement).style.borderLeftColor).toBe(color)
  })

  it('names an open dispute "Under review" and links the explorer', () => {
    const snapshot = buildSnapshot({ safeTxHash: HASH as `0x${string}`, status: CheckStatus.DISPUTED })
    mockUseSafenetCheck.mockReturnValue(
      buildCheckView({ snapshot, status: CheckStatus.DISPUTED, publicStatus: CheckStatus.DISPUTED }),
    )

    renderInFlow({ txId: TX_ID, txDetails })

    expect(screen.getByRole('status')).toHaveTextContent('Safenet: Under review')
    expect(screen.getByTestId('safenet-explorer-link')).toBeInTheDocument()
  })

  it('pulses instead of showing a severity icon while the check runs', () => {
    const snapshot = buildSnapshot({ safeTxHash: HASH as `0x${string}`, status: CheckStatus.IN_PROGRESS })
    mockUseSafenetCheck.mockReturnValue(
      buildCheckView({ snapshot, status: CheckStatus.IN_PROGRESS, publicStatus: CheckStatus.IN_PROGRESS }),
    )

    renderInFlow({ txId: TX_ID, txDetails })

    expect(screen.getByTestId('safenet-check-pulse')).toBeInTheDocument()
  })

  it('keeps the check locked and shows its education on keyboard focus', async () => {
    mockUseSafenetCheck.mockReturnValue(buildCheckView())

    const { user } = renderInFlow({ txId: TX_ID, txDetails }, true)

    expect(screen.getByTestId('safenet-checks-locked')).toBeInTheDocument()
    expect(screen.queryByTestId('safenet-checks-section')).not.toBeInTheDocument()
    await user.tab()
    expect(await screen.findByRole('link', { name: /Learn more/ })).toBeInTheDocument()
  })

  it('shows the pre-check note while a new transaction is being created', async () => {
    mockUseSafenetCheck.mockReturnValue(buildCheckView())

    const { user } = renderInFlow({ isCreation: true, isProposing: false, willExecute: false, txLayoutProps: {} })

    expect(screen.getByTestId('safenet-checks-section')).toHaveAttribute('data-status', 'PRE_CHECK')
    await user.tab()
    expect(await screen.findByRole('link', { name: /Learn more/ })).toBeInTheDocument()
    expect(screen.getByText(/The check starts after you sign/)).toBeInTheDocument()
  })
})
