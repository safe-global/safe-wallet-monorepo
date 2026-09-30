import { render, screen } from '@/tests/test-utils'
import { CheckStatus, type PublicCheckStatus } from '@safe-global/utils/features/safenet-checks'
import { useSafenetCheck } from '@safe-global/utils/features/safenet-checks/hooks'
import { buildCheckView, buildSnapshot } from '@safe-global/utils/features/safenet-checks/builders'
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
})
