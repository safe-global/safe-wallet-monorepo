import { render, screen } from '@/tests/test-utils'
import { CheckStatus, type PublicCheckStatus } from '@safe-global/utils/features/safenet-checks'
import { useSafenetCheck } from '@safe-global/utils/features/safenet-checks/hooks'
import {
  buildCheckView,
  buildSnapshot,
  sentinelRevealedEvent,
} from '@safe-global/utils/features/safenet-checks/builders'
import { SafenetQueueStatus } from '../SafenetQueueStatus'

jest.mock('@safe-global/utils/features/safenet-checks/hooks', () => ({
  ...jest.requireActual('@safe-global/utils/features/safenet-checks/hooks'),
  useSafenetCheck: jest.fn(),
}))

const mockUseSafenetCheck = useSafenetCheck as jest.MockedFunction<typeof useSafenetCheck>

const HASH = `0x${'ab'.repeat(32)}`
const TS = 1_700_000_000_000

describe('SafenetQueueStatus', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders nothing when no check was observed', () => {
    mockUseSafenetCheck.mockReturnValue(buildCheckView())

    const { container } = render(<SafenetQueueStatus safeTxHash={HASH} timestampMs={TS} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing for a pinned verdict without a snapshot (collapse invariant)', () => {
    // A session-pinned floor must stay invisible until a refetch restores the
    // snapshot — a verdict row with no data behind it would be unexplainable.
    mockUseSafenetCheck.mockReturnValue(
      buildCheckView({ snapshot: undefined, status: CheckStatus.MALICIOUS, publicStatus: CheckStatus.MALICIOUS }),
    )

    const { container } = render(<SafenetQueueStatus safeTxHash={HASH} timestampMs={TS} />)

    expect(container).toBeEmptyDOMElement()
  })

  it.each<[Exclude<PublicCheckStatus, CheckStatus.UNAVAILABLE>, string]>([
    [CheckStatus.SUBMITTED, 'Submitted'],
    [CheckStatus.IN_PROGRESS, 'Simulating'],
    [CheckStatus.BENIGN, 'No issues found'],
    [CheckStatus.MALICIOUS, 'Risk detected'],
    [CheckStatus.TIMED_OUT, 'Safenet check failed'],
  ])('renders %s as "%s"', (status, label) => {
    const snapshot = buildSnapshot({ safeTxHash: HASH as `0x${string}`, status })
    mockUseSafenetCheck.mockReturnValue(buildCheckView({ snapshot, status, publicStatus: status }))

    render(<SafenetQueueStatus safeTxHash={HASH} timestampMs={TS} />)

    const cell = screen.getByTestId('safenet-queue-status')
    expect(cell).toHaveAttribute('data-status', status)
    expect(cell).toHaveTextContent(label)
  })

  const renderStatus = (status: Exclude<PublicCheckStatus, CheckStatus.UNAVAILABLE>, over = {}, variant?: 'chip') => {
    const snapshot = buildSnapshot({ safeTxHash: HASH as `0x${string}`, status, ...over })
    mockUseSafenetCheck.mockReturnValue(buildCheckView({ snapshot, status, publicStatus: status }))
    render(<SafenetQueueStatus safeTxHash={HASH} timestampMs={TS} variant={variant} />)
    return screen.getByTestId('safenet-queue-status')
  }

  it('gives screen readers the full sentence, not just the label', () => {
    const cell = renderStatus(CheckStatus.BENIGN)

    expect(cell).toHaveAttribute('aria-live', 'polite')
    expect(cell).toHaveTextContent('Safenet: Safenet found no issues.')
  })

  it('renders the prominent chip variant for queue rows', () => {
    const cell = renderStatus(CheckStatus.MALICIOUS, {}, 'chip')

    expect(cell).toHaveAttribute('data-variant', 'chip')
    expect(cell.querySelector('[data-slot="chip"]')).toHaveTextContent('Risk detected')
  })

  it('uses a short chip label so the row never truncates it', () => {
    const cell = renderStatus(CheckStatus.TIMED_OUT, {}, 'chip')

    expect(cell.querySelector('[data-slot="chip"]')).toHaveTextContent(/^Check failed$/)
    expect(cell).toHaveTextContent("Safenet: Safenet couldn't reach a trusted result")
  })

  it('summarises the flagged rule and the sentinel count', () => {
    const cell = renderStatus(CheckStatus.MALICIOUS, {
      events: [
        sentinelRevealedEvent({ sentinel: '0x1', approved: false, reason: 'R-4.1' }),
        sentinelRevealedEvent({ sentinel: '0x2', approved: false, reason: 'R-4.1' }),
      ],
    })

    expect(cell).toHaveTextContent('Safe account settings change. 2 of 2 sentinels flagged this.')
  })

  it('shows the time left while simulating', () => {
    const cell = renderStatus(CheckStatus.IN_PROGRESS, { headBlock: '1000', deadlineBlock: '1024' })

    expect(cell).toHaveTextContent('Simulating · up to ~2 min')
  })

  it('keeps the chip label short while simulating and moves the time left to the description', () => {
    const cell = renderStatus(CheckStatus.IN_PROGRESS, { headBlock: '1000', deadlineBlock: '1024' }, 'chip')

    expect(cell.querySelector('.truncate')).toHaveTextContent(/^Simulating$/)
    expect(cell.querySelector('.sr-only')).toHaveTextContent('Simulating · up to ~2 min.')
  })
})
