import { render, screen } from '@/tests/test-utils'
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

jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: () => ({ safe: { chainId: '1', threshold: 2 }, safeAddress: '0x0000000000000000000000000000000000000123' }),
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

const renderInFlow = (flow: Partial<TxFlowContextType>) =>
  render(
    <TxFlowContext.Provider value={flow as TxFlowContextType}>
      <SafenetChecksSection />
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
    expect(section).toHaveTextContent("We couldn't confirm whether Safenet checked this transaction.")
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
    expect(section).toHaveTextContent("We'll keep trying. You can still continue.")
    expect(screen.getByTestId('safenet-explorer-link')).toHaveTextContent('View on Safenet explorer')
  })

  it.each<[Exclude<PublicCheckStatus, CheckStatus.UNAVAILABLE>, string]>([
    [CheckStatus.SUBMITTED, 'Check submitted to Safenet. It takes about a minute.'],
    [CheckStatus.IN_PROGRESS, 'Safenet is simulating this transaction. It takes about a minute.'],
    [CheckStatus.BENIGN, 'Safenet found no issues.'],
    [CheckStatus.MALICIOUS, 'Safenet flagged this transaction as malicious.'],
    [CheckStatus.TIMED_OUT, "Safenet couldn't reach a trusted result for this transaction. You can still continue."],
  ])('renders %s copy', (status, copy) => {
    const snapshot = buildSnapshot({ safeTxHash: HASH as `0x${string}`, status })
    mockUseSafenetCheck.mockReturnValue(buildCheckView({ snapshot, status, publicStatus: status }))

    renderInFlow({ txId: TX_ID, txDetails })

    const section = screen.getByTestId('safenet-checks-section')
    expect(section).toHaveAttribute('data-status', status)
    expect(screen.getByRole('img', { name: 'Safenet' })).toBeInTheDocument()
    expect(section).toHaveTextContent(copy)
    expect(screen.getByTestId('safenet-about-link')).toHaveTextContent('What is Safenet?')
  })

  it('announces status changes politely', () => {
    const snapshot = buildSnapshot({ safeTxHash: HASH as `0x${string}`, status: CheckStatus.SUBMITTED })
    mockUseSafenetCheck.mockReturnValue(
      buildCheckView({ snapshot, status: CheckStatus.SUBMITTED, publicStatus: CheckStatus.SUBMITTED }),
    )

    renderInFlow({ txId: TX_ID, txDetails })

    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
  })

  it('shows the time left until the reveal deadline while simulating', () => {
    // 24 blocks of 5s = 2 min.
    const snapshot = buildSnapshot({
      safeTxHash: HASH as `0x${string}`,
      status: CheckStatus.IN_PROGRESS,
      headBlock: '1000',
      deadlineBlock: '1024',
    })
    mockUseSafenetCheck.mockReturnValue(
      buildCheckView({ snapshot, status: CheckStatus.IN_PROGRESS, publicStatus: CheckStatus.IN_PROGRESS }),
    )

    renderInFlow({ txId: TX_ID, txDetails })

    expect(screen.getByTestId('safenet-check-timing')).toHaveTextContent('Up to about 2 min left.')
    expect(screen.getByTestId('safenet-checks-section')).toHaveTextContent(
      "You don't have to wait for the result to sign.",
    )
  })

  it('flags a stale in-flight status', () => {
    const snapshot = buildSnapshot({ safeTxHash: HASH as `0x${string}`, status: CheckStatus.SUBMITTED })
    mockUseSafenetCheck.mockReturnValue(
      buildCheckView({ snapshot, status: CheckStatus.SUBMITTED, publicStatus: CheckStatus.SUBMITTED, isStale: true }),
    )

    renderInFlow({ txId: TX_ID, txDetails })

    expect(screen.getByTestId('safenet-checks-section')).toHaveTextContent('Status may be out of date.')
  })

  describe('MALICIOUS', () => {
    const reveal = (sentinel: string, reason: string | null) =>
      sentinelRevealedEvent({ sentinel, approved: reason === null, reason: reason ?? '' })

    const renderMalicious = (events: ReturnType<typeof reveal>[]) => {
      const snapshot = buildSnapshot({ safeTxHash: HASH as `0x${string}`, status: CheckStatus.MALICIOUS, events })
      mockUseSafenetCheck.mockReturnValue(
        buildCheckView({ snapshot, status: CheckStatus.MALICIOUS, publicStatus: CheckStatus.MALICIOUS }),
      )
      renderInFlow({ txId: TX_ID, txDetails })
      return screen.getByTestId('safenet-checks-section')
    }

    it('titles a single rule with its label and explains it below', () => {
      const section = renderMalicious([reveal('0x1', 'R-4.6')])

      expect(section).toHaveTextContent('Blocklisted address')
      expect(section).toHaveTextContent("on Safenet's list of malicious or compromised addresses")
      expect(screen.getByTestId('safenet-flagged-count')).toHaveTextContent('1 of 1 sentinel flagged this.')
    })

    it('says a settings change is expected to be flagged (R-4.1)', () => {
      const section = renderMalicious([reveal('0x1', null), reveal('0x2', 'R-4.1')])

      expect(section).toHaveTextContent('Safe account settings change')
      expect(section).toHaveTextContent('Safenet flags every settings change, so this is expected')
      expect(screen.getByTestId('safenet-flagged-count')).toHaveTextContent('1 of 2 sentinels flagged this.')
    })

    it('lists several rules under one title, most-cited first', () => {
      renderMalicious([reveal('0x1', 'R-4.4'), reveal('0x2', 'R-4.5'), reveal('0x3', 'R-4.5')])

      expect(screen.getByText('Malicious threats detected')).toBeInTheDocument()
      const rules = screen.getByTestId('safenet-rejection-rules')
      expect(rules.textContent?.indexOf('Excessive approval')).toBeLessThan(
        rules.textContent?.indexOf('Lookalike spender') ?? -1,
      )
    })

    it('falls back to the generic copy for an unrecognised code', () => {
      const section = renderMalicious([reveal('0x1', 'R-9.9')])

      expect(section).toHaveTextContent('Risk detected')
      expect(section).toHaveTextContent('Safenet flagged this transaction as malicious.')
      expect(section).toHaveTextContent('1 of 1 sentinel flagged this.')
    })

    it('links the explorer, never an attestation', () => {
      renderMalicious([reveal('0x1', 'R-4.2')])

      expect(screen.getByTestId('safenet-explorer-link')).toHaveTextContent('View on Safenet explorer')
      expect(screen.getByTestId('safenet-explorer-link')).toHaveAttribute(
        'href',
        expect.stringContaining(`/#/safeTx?chainId=`),
      )
      expect(screen.queryByTestId('safenet-attestation-link')).not.toBeInTheDocument()
    })
  })

  describe('before the first signature', () => {
    const creationFlow = { isCreation: true, isProposing: false, willExecute: false, txLayoutProps: {} }

    it('explains when the check runs and that signing need not wait', () => {
      mockUseSafenetCheck.mockReturnValue(buildCheckView())

      renderInFlow(creationFlow)

      const section = screen.getByTestId('safenet-checks-section')
      expect(section).toHaveAttribute('data-status', 'PRE_CHECK')
      expect(section).toHaveTextContent('Safenet checks this transaction after you sign. It takes about a minute.')
      expect(section).toHaveTextContent('You can sign now and come back to execute.')
      expect(screen.getByRole('link', { name: /What is Safenet\?/ })).toBeInTheDocument()
    })

    it('tells a signer who executes in the same click how to see the result first', () => {
      mockUseSafenetCheck.mockReturnValue(buildCheckView())

      renderInFlow({ ...creationFlow, willExecute: true })

      const section = screen.getByTestId('safenet-checks-section')
      expect(section).toHaveAttribute('data-reason', 'executeNow')
      expect(section).toHaveTextContent('To see the result before it executes, choose "No, later"')
    })

    it.each([
      ['a proposer', { isProposing: true }],
      ['a message', { txLayoutProps: { isMessage: true } }],
    ])('stays hidden for %s', (_name, override) => {
      mockUseSafenetCheck.mockReturnValue(buildCheckView())

      const { container } = renderInFlow({ ...creationFlow, ...override })

      expect(container).toBeEmptyDOMElement()
    })
  })
})
