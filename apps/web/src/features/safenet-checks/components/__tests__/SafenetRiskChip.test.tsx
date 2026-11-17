import { render, screen } from '@/tests/test-utils'
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
import SafenetRiskChip from '../SafenetRiskChip'

jest.mock('@safe-global/utils/features/safenet-checks/hooks', () => ({
  ...jest.requireActual('@safe-global/utils/features/safenet-checks/hooks'),
  useSafenetCheck: jest.fn(),
}))

const safeTxHash = `0x${'ab'.repeat(32)}` as Hex

const mockStatus = (status: PublicCheckStatus, events: SafenetCheckSnapshot['events'] = []) => {
  const snapshot = buildSnapshot({ safeTxHash, status, events })
  jest.mocked(useSafenetCheck).mockReturnValue(buildCheckView({ snapshot, status, publicStatus: status }))
}

describe('SafenetRiskChip', () => {
  it('shows "Risk detected" for a check that found a risk', () => {
    mockStatus(CheckStatus.MALICIOUS)

    render(<SafenetRiskChip safeTxHash={safeTxHash} timestampMs={1_700_000_000_000} />)

    expect(screen.getByTestId('safenet-risk-chip')).toHaveTextContent('Risk detected')
    expect(useSafenetCheck).toHaveBeenCalledWith(safeTxHash, 1_700_000_000_000, expect.anything())
  })

  it.each([
    ['R-4.2', 'Issues found'],
    ['R-4.6', 'Risk detected'],
  ])('names a risk citing %s "%s", like the details card', (reason, label) => {
    mockStatus(CheckStatus.MALICIOUS, [sentinelRevealedEvent({ approved: false, reason })])

    render(<SafenetRiskChip safeTxHash={safeTxHash} />)

    expect(screen.getByTestId('safenet-risk-chip')).toHaveTextContent(label)
  })

  it.each([CheckStatus.SUBMITTED, CheckStatus.IN_PROGRESS, CheckStatus.BENIGN, CheckStatus.TIMED_OUT] as const)(
    'shows nothing for a %s check',
    (status) => {
      mockStatus(status)

      const { container } = render(<SafenetRiskChip safeTxHash={safeTxHash} />)

      expect(container).toBeEmptyDOMElement()
    },
  )

  it('shows nothing when no check was observed', () => {
    jest.mocked(useSafenetCheck).mockReturnValue(buildCheckView())

    const { container } = render(<SafenetRiskChip safeTxHash={safeTxHash} />)

    expect(container).toBeEmptyDOMElement()
  })
})
