import { render, screen, within } from '@/tests/test-utils'
import { CheckStatus } from '@safe-global/utils/features/safenet-checks'
import { buildSnapshot, sentinelRevealedEvent } from '@safe-global/utils/features/safenet-checks/builders'
import { SafenetDetailsCardView } from '../SafenetDetailsCard'

const HASH = `0x${'ab'.repeat(32)}` as const

const vote = (index: number, reason: string | null) =>
  sentinelRevealedEvent({
    sentinel: `0x${String(index + 1).padStart(40, '0')}`,
    approved: reason === null,
    reason: reason ?? '',
    blockNumber: 100 + index,
    logIndex: 0,
  })

const renderCard = (
  publicStatus: Parameters<typeof SafenetDetailsCardView>[0]['publicStatus'],
  events: ReturnType<typeof vote>[] = [],
) =>
  render(
    <SafenetDetailsCardView
      publicStatus={publicStatus}
      snapshot={buildSnapshot({ safeTxHash: HASH, status: publicStatus, events })}
      safeTxHash={HASH}
      chainId="1"
      isQueued
      defaultExpanded
    />,
  )

const outcomeOf = (rule: string) =>
  within(screen.getByTestId('safenet-details-rules')).getByText(rule).closest('li')?.getAttribute('data-outcome')

describe('SafenetDetailsCardView', () => {
  it('shows the state on the collapsed header', () => {
    render(
      <SafenetDetailsCardView
        publicStatus={CheckStatus.MALICIOUS}
        snapshot={buildSnapshot({ safeTxHash: HASH, status: CheckStatus.MALICIOUS })}
        safeTxHash={HASH}
        chainId="1"
      />,
    )

    expect(screen.getByTestId('safenet-details-card')).toHaveAttribute('data-status', CheckStatus.MALICIOUS)
    expect(screen.getByText('Risk detected')).toBeInTheDocument()
    expect(screen.queryByTestId('safenet-details-rules')).not.toBeInTheDocument()
  })

  it('marks the cited rules on a risk and clears the rest', () => {
    renderCard(CheckStatus.MALICIOUS, [vote(0, 'R-4.5'), vote(1, 'R-4.5'), vote(2, 'R-4.4')])

    expect(outcomeOf('Excessive approval')).toBe('Flagged by 2 sentinels')
    expect(outcomeOf('Lookalike spender')).toBe('Flagged by 1 sentinel')
    expect(outcomeOf('Blocklisted address')).toBe('Not detected')
    expect(screen.getByText(/3 of 3 sentinels flagged this transaction/)).toBeInTheDocument()
  })

  it('lists every rule as not detected when no issues were found', () => {
    renderCard(CheckStatus.BENIGN, [vote(0, null), vote(1, null)])

    const rows = within(screen.getByTestId('safenet-details-rules')).getAllByRole('listitem')
    expect(rows).toHaveLength(6)
    rows.forEach((row) => expect(row).toHaveAttribute('data-outcome', 'Not detected'))
    expect(screen.getByText(/2 of 2 sentinels approved this transaction/)).toBeInTheDocument()
  })

  it('shows the rules as pending while the check runs and tells the signer they can come back', () => {
    renderCard(CheckStatus.IN_PROGRESS)

    expect(screen.getByText('What Safenet checks')).toBeInTheDocument()
    expect(outcomeOf('Lookalike recipient')).toBe('Checking')
    expect(screen.getByText(/come back to execute/)).toBeInTheDocument()
    expect(screen.queryByTestId('safenet-details-explorer')).not.toBeInTheDocument()
  })

  it('leaves unflagged rules without a result when the check failed', () => {
    renderCard(CheckStatus.TIMED_OUT, [vote(0, null), vote(1, 'R-4.3')])

    expect(outcomeOf('Lookalike recipient')).toBe('Flagged by 1 sentinel')
    expect(outcomeOf('Excessive approval')).toBe('No result')
    expect(screen.getByTestId('safenet-details-explorer')).toBeInTheDocument()
  })

  it('never claims verification for a result that is not a verified no-issues', () => {
    render(
      <SafenetDetailsCardView
        publicStatus={CheckStatus.TIMED_OUT}
        snapshot={buildSnapshot({ safeTxHash: HASH, status: CheckStatus.TIMED_OUT, attestedAtMs: 1_770_000_000_000 })}
        safeTxHash={HASH}
        chainId="1"
        defaultExpanded
      />,
    )

    expect(screen.queryByText(/Verified/)).not.toBeInTheDocument()
    expect(screen.queryByTestId('safenet-details-attestation')).not.toBeInTheDocument()
  })

  it('only invites the signer to come back while the transaction is queued', () => {
    render(
      <SafenetDetailsCardView
        publicStatus={CheckStatus.IN_PROGRESS}
        snapshot={buildSnapshot({ safeTxHash: HASH, status: CheckStatus.IN_PROGRESS })}
        safeTxHash={HASH}
        chainId="1"
        defaultExpanded
      />,
    )

    expect(screen.queryByText(/come back to execute/)).not.toBeInTheDocument()
  })
})
