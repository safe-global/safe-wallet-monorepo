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
import { SAFENET_EXPLORER_LINK_LABEL } from '../SafenetLinks'

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
  renderWithUserEvent(
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
    expect(screen.getByTestId('safenet-explorer-link')).toHaveAccessibleName(SAFENET_EXPLORER_LINK_LABEL)
  })

  it.each<[Exclude<PublicCheckStatus, CheckStatus.UNAVAILABLE>, string]>([
    [CheckStatus.SUBMITTED, 'Check submitted to Safenet.'],
    [CheckStatus.IN_PROGRESS, 'Safenet is simulating this transaction.'],
    [CheckStatus.BENIGN, 'Safenet found no issues'],
    [CheckStatus.MALICIOUS, 'Safenet flagged this address/transaction as malicious'],
    [CheckStatus.TIMED_OUT, 'Safenet check is unavailable. You can still continue.'],
  ])('preserves %s results and offers separate general education', async (status, copy) => {
    const snapshot = buildSnapshot({ safeTxHash: HASH as `0x${string}`, status })
    mockUseSafenetCheck.mockReturnValue(buildCheckView({ snapshot, status, publicStatus: status }))

    const { user } = renderInFlow({ txId: TX_ID, txDetails })

    const section = screen.getByTestId('safenet-checks-section')
    expect(section).toHaveAttribute('data-status', status)
    expect(screen.getByTestId('safenet-section-label')).toHaveTextContent('Safenet')
    expect(section).toHaveTextContent(copy)
    expect(section).not.toHaveTextContent('Independent sentinels')
    expect(screen.queryByRole('link', { name: /Learn more/ })).not.toBeInTheDocument()
    const trigger = screen.getByLabelText('About Safenet')
    expect(trigger.closest('[data-slot=collapsible-trigger]')).toBeNull()
    await user.hover(trigger)
    const tooltip = (await screen.findByRole('link', { name: /Learn more/ })).closest('[data-slot=tooltip-content]')
    expect(tooltip).toHaveTextContent(
      "Independent sentinels simulate this transaction and check it against Safenet's security rules.",
    )
    expect(section).toHaveTextContent(copy)
  })

  it('keeps the check locked and shows education only when its information icon receives focus', async () => {
    mockUseSafenetCheck.mockReturnValue(buildCheckView())

    const { container, user } = renderWithUserEvent(
      <TxFlowContext.Provider value={{ txId: TX_ID, txDetails } as TxFlowContextType}>
        <SafenetChecksSection locked />
      </TxFlowContext.Provider>,
    )

    const section = screen.getByTestId('safenet-checks-locked')
    expect(mockUseSafenetCheck).toHaveBeenCalledWith(undefined, SUBMITTED_AT, expect.objectContaining({ chainId: '1' }))
    expect(container.querySelector('.lucide-lock-keyhole')).toBeInTheDocument()
    expect(section).toHaveTextContent('Safenet check')
    expect(screen.queryByRole('link', { name: /Learn more/ })).not.toBeInTheDocument()
    await user.tab()
    expect(screen.getByLabelText('About Safenet check')).toHaveFocus()
    const tooltip = (await screen.findByRole('link', { name: /Learn more/ })).closest('[data-slot=tooltip-content]')
    expect(tooltip).toHaveTextContent(
      "Independent sentinels simulate this transaction and check it against Safenet's security rules.",
    )
    expect(tooltip).toHaveTextContent('The check starts after you sign. The next signer will see the result.')
    expect(tooltip).not.toHaveTextContent('takes about a minute')
    expect(screen.getByRole('link', { name: /Learn more/ })).toHaveAttribute(
      'href',
      'https://docs.safefoundation.org/safenet',
    )
    expect(screen.queryByTestId('safenet-checks-section')).not.toBeInTheDocument()
  })

  it('keeps result expansion and adjacent education independently accessible by keyboard', async () => {
    const snapshot = buildSnapshot({ safeTxHash: HASH as `0x${string}`, status: CheckStatus.BENIGN })
    mockUseSafenetCheck.mockReturnValue(
      buildCheckView({ snapshot, status: CheckStatus.BENIGN, publicStatus: CheckStatus.BENIGN }),
    )
    const { user } = renderInFlow({ txId: TX_ID, txDetails })
    const toggle = screen.getByRole('button', { name: 'Safenet' })

    await user.tab()
    expect(toggle).toHaveFocus()
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await user.keyboard('{Enter}')
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await user.tab()
    expect(screen.getByLabelText('About Safenet')).toHaveFocus()
    const link = await screen.findByRole('link', { name: /Learn more/ })
    await user.tab()
    expect(link).toHaveFocus()
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
  })

  it('announces status changes politely', () => {
    const snapshot = buildSnapshot({ safeTxHash: HASH as `0x${string}`, status: CheckStatus.SUBMITTED })
    mockUseSafenetCheck.mockReturnValue(
      buildCheckView({ snapshot, status: CheckStatus.SUBMITTED, publicStatus: CheckStatus.SUBMITTED }),
    )

    renderInFlow({ txId: TX_ID, txDetails })

    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
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

      expect(section).toHaveTextContent('Malicious threat detected')
      expect(section).toHaveTextContent('known to be malicious or compromised')
      expect(screen.getByTestId('safenet-flagged-count')).toHaveTextContent('1 of 1 sentinel flagged this.')
    })

    it('uses the PRD description for a settings change (R-4.1)', () => {
      const section = renderMalicious([reveal('0x1', null), reveal('0x2', 'R-4.1')])

      expect(section).toHaveTextContent('Safe account settings change')
      expect(section).toHaveTextContent(
        'This transaction changes signers, threshold, modules, guard, or fallback handler.',
      )
      expect(section).not.toHaveTextContent('Safenet flags every settings change')
      expect(screen.getByTestId('safenet-flagged-count')).toHaveTextContent('1 of 2 sentinels flagged this.')
    })

    it('lists several rules under one title, most-cited first', () => {
      renderMalicious([reveal('0x1', 'R-4.4'), reveal('0x2', 'R-4.5'), reveal('0x3', 'R-4.5')])

      // The shared title is announced; each rule gets its own block.
      expect(screen.getByRole('status')).toHaveTextContent('Safenet: Malicious threats detected')
      const rules = screen.getByTestId('safenet-rejection-rules')
      expect(rules.textContent?.indexOf('Unlimited approval')).toBeLessThan(
        rules.textContent?.indexOf('Unknown spender') ?? -1,
      )
    })

    it('falls back to the generic copy for an unrecognised code', () => {
      const section = renderMalicious([reveal('0x1', 'R-9.9')])

      expect(section).toHaveTextContent('Risk detected')
      expect(section).toHaveTextContent('Safenet flagged this address/transaction as malicious')
      expect(section).toHaveTextContent('1 of 1 sentinel flagged this.')
    })

    it('links the explorer, never an attestation', () => {
      renderMalicious([reveal('0x1', 'R-4.2')])

      expect(screen.getByTestId('safenet-explorer-link')).toHaveAccessibleName(SAFENET_EXPLORER_LINK_LABEL)
      expect(screen.getByTestId('safenet-explorer-link')).toHaveAttribute(
        'href',
        expect.stringContaining(`/#/safeTx?chainId=`),
      )
      expect(screen.queryByTestId('safenet-attestation-link')).not.toBeInTheDocument()
    })
  })

  describe('before the first signature', () => {
    const creationFlow = { isCreation: true, isProposing: false, willExecute: false, txLayoutProps: {} }

    it('keeps pre-check education in a keyboard-accessible tooltip', async () => {
      mockUseSafenetCheck.mockReturnValue(buildCheckView())

      const { user } = renderInFlow(creationFlow)

      const section = screen.getByTestId('safenet-checks-section')
      expect(section).toHaveAttribute('data-status', 'PRE_CHECK')
      expect(section).not.toHaveTextContent('Independent sentinels')
      expect(screen.queryByRole('link', { name: /Learn more/ })).not.toBeInTheDocument()
      expect(section.querySelector('[data-slot=collapsible-trigger]')).toBeNull()
      await user.tab()
      expect(screen.getByLabelText('About Safenet')).toHaveFocus()
      const link = await screen.findByRole('link', { name: /Learn more/ })
      const tooltip = link.closest('[data-slot=tooltip-content]')
      expect(tooltip).toHaveTextContent(
        "Independent sentinels simulate this transaction and check it against Safenet's security rules.",
      )
      expect(tooltip).toHaveTextContent('The check starts after you sign. The next signer will see the result.')
      expect(tooltip).not.toHaveTextContent('takes about a minute')
      expect(link).toHaveAttribute('href', 'https://docs.safefoundation.org/safenet')
      await user.tab()
      expect(link).toHaveFocus()
    })

    it('tells a signer who executes in the same click how to see the result first', async () => {
      mockUseSafenetCheck.mockReturnValue(buildCheckView())

      const { user } = renderInFlow({ ...creationFlow, willExecute: true })

      expect(screen.getByTestId('safenet-checks-section')).toHaveAttribute('data-reason', 'executeNow')
      await user.hover(screen.getByLabelText('About Safenet'))
      const tooltip = (await screen.findByRole('link', { name: /Learn more/ })).closest('[data-slot=tooltip-content]')
      expect(tooltip).toHaveTextContent('Choose "No, later" to see the result before executing.')
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

  it('pulses instead of showing a severity icon while the check runs', () => {
    const snapshot = buildSnapshot({ safeTxHash: HASH as `0x${string}`, status: CheckStatus.IN_PROGRESS })
    mockUseSafenetCheck.mockReturnValue(
      buildCheckView({ snapshot, status: CheckStatus.IN_PROGRESS, publicStatus: CheckStatus.IN_PROGRESS }),
    )

    renderInFlow({ txId: TX_ID, txDetails })

    expect(screen.getByTestId('safenet-check-pulse')).toBeInTheDocument()
  })
})
