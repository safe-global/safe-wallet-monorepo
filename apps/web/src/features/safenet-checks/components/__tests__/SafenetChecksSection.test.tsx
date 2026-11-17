import { renderWithUserEvent, screen } from '@/tests/test-utils'
import { TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { DetailedExecutionInfoType } from '@safe-global/store/gateway/types'
import {
  CheckStatus,
  type Hex,
  type PublicCheckStatus,
  type SafenetCheckSnapshot,
} from '@safe-global/utils/features/safenet-checks'
import { useSafenetCheck } from '@safe-global/utils/features/safenet-checks/hooks'
import {
  buildCheckView,
  buildSnapshot,
  sentinelRevealedEvent,
} from '@safe-global/utils/features/safenet-checks/builders'
import { SafenetChecksSection } from '../SafenetChecksSection'
import {
  MixpanelEventParams,
  SAFENET_EVENTS,
  SafenetCheckResult,
  SafenetSignerRole,
  trackEvent,
} from '@/services/analytics'

jest.mock('@safe-global/utils/features/safenet-checks/hooks', () => ({
  ...jest.requireActual('@safe-global/utils/features/safenet-checks/hooks'),
  useSafenetCheck: jest.fn(),
}))
jest.mock('@/services/analytics', () => ({ ...jest.requireActual('@/services/analytics'), trackEvent: jest.fn() }))

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

describe('SafenetChecksSection Mixpanel tracking', () => {
  let hashCount = 0
  const newHash = (): Hex => `0x${(++hashCount).toString(16).padStart(64, '0')}`
  const flowOf = (hash: string, over: Partial<TxFlowContextType> = {}): Partial<TxFlowContextType> => ({
    txId: `multisig_${SAFE}_${hash}`,
    txDetails,
    ...over,
  })
  const show = (hash: Hex, status: PublicCheckStatus, events: SafenetCheckSnapshot['events'] = []) =>
    mockUseSafenetCheck.mockReturnValue(
      buildCheckView({ snapshot: buildSnapshot({ safeTxHash: hash, status, events }), status, publicStatus: status }),
    )

  beforeEach(() => jest.clearAllMocks())

  it('tracks a risk with its rules, the sentinel tally and the signer role', () => {
    const hash = newHash()
    show(hash, CheckStatus.MALICIOUS, [
      sentinelRevealedEvent({ approved: false, reason: 'R-4.5' }),
      sentinelRevealedEvent({ approved: false, reason: 'R-4.4' }),
      sentinelRevealedEvent({ approved: true, reason: '' }),
    ])

    renderInFlow(flowOf(hash))

    expect(trackEvent).toHaveBeenCalledTimes(1)
    expect(trackEvent).toHaveBeenCalledWith(SAFENET_EVENTS.CHECKED, {
      [MixpanelEventParams.SAFE_TX_HASH]: hash,
      [MixpanelEventParams.RESULT]: SafenetCheckResult.RISK_DETECTED,
      [MixpanelEventParams.RULES_FLAGGED]: ['R-4.4', 'R-4.5'],
      [MixpanelEventParams.SENTINELS_FLAGGED]: '2 of 3',
      [MixpanelEventParams.SIGNER_ROLE]: SafenetSignerRole.CO_SIGNER,
    })
  })

  it.each([
    ['creates the transaction', { isCreation: true }, SafenetSignerRole.FIRST_SIGNER],
    ['signs an existing transaction', {}, SafenetSignerRole.CO_SIGNER],
    ['signs and executes', { willExecute: true }, SafenetSignerRole.EXECUTOR],
    ['only executes', { onlyExecute: true }, SafenetSignerRole.EXECUTOR],
  ])('tracks no rules for a check without issues when the user %s', (_title, flow, role) => {
    const hash = newHash()
    show(hash, CheckStatus.BENIGN, [sentinelRevealedEvent({ approved: false, reason: 'R-4.4' })])

    renderInFlow(flowOf(hash, flow))

    expect(trackEvent).toHaveBeenCalledWith(SAFENET_EVENTS.CHECKED, {
      [MixpanelEventParams.SAFE_TX_HASH]: hash,
      [MixpanelEventParams.RESULT]: SafenetCheckResult.NO_ISSUES,
      [MixpanelEventParams.RULES_FLAGGED]: [],
      [MixpanelEventParams.SENTINELS_FLAGGED]: '1 of 1',
      [MixpanelEventParams.SIGNER_ROLE]: role,
    })
  })

  it('tracks a failed read as unavailable, without a snapshot', () => {
    const hash = newHash()
    mockUseSafenetCheck.mockReturnValue(buildCheckView({ unavailableReason: 'READ_FAILED' }))
    renderInFlow(flowOf(hash))

    expect(trackEvent).toHaveBeenCalledWith(SAFENET_EVENTS.CHECKED, {
      [MixpanelEventParams.SAFE_TX_HASH]: hash,
      [MixpanelEventParams.RESULT]: SafenetCheckResult.UNAVAILABLE,
      [MixpanelEventParams.RULES_FLAGGED]: [],
      [MixpanelEventParams.SENTINELS_FLAGGED]: '0 of 0',
      [MixpanelEventParams.SIGNER_ROLE]: SafenetSignerRole.CO_SIGNER,
    })
  })

  it('tracks nothing while the check is in progress', () => {
    const hash = newHash()
    show(hash, CheckStatus.IN_PROGRESS)
    renderInFlow(flowOf(hash))

    expect(trackEvent).not.toHaveBeenCalled()
  })

  it('tracks nothing for a verdict whose snapshot is not on screen', () => {
    mockUseSafenetCheck.mockReturnValue(
      buildCheckView({ status: CheckStatus.MALICIOUS, publicStatus: CheckStatus.MALICIOUS }),
    )
    renderInFlow(flowOf(newHash()))

    expect(trackEvent).not.toHaveBeenCalled()
  })

  it('tracks once per result across remounts and again when the result changes', () => {
    const hash = newHash()
    const flow = flowOf(hash)
    show(hash, CheckStatus.DISPUTED)
    renderInFlow(flow).unmount()
    const { rerender } = renderInFlow(flow)
    expect(trackEvent).toHaveBeenCalledTimes(1)

    show(hash, CheckStatus.MALICIOUS)
    rerender(
      <TxFlowContext.Provider value={flow as TxFlowContextType}>
        <SafenetChecksSection />
      </TxFlowContext.Provider>,
    )

    expect(jest.mocked(trackEvent).mock.calls.map(([, params]) => params?.[MixpanelEventParams.RESULT])).toEqual([
      SafenetCheckResult.NO_RULING,
      SafenetCheckResult.RISK_DETECTED,
    ])
  })
})
