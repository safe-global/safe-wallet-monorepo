import { render, screen } from '@/tests/test-utils'
import { useChain } from '@/hooks/useChains'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { AttestationVerificationStatus, CheckStatus } from '@safe-global/utils/features/safenet-checks'
import {
  attestedEvent,
  buildBenignSnapshot,
  buildSnapshot,
  sentinelRevealedEvent,
} from '@safe-global/utils/features/safenet-checks/builders'
import { SafenetDetailsCardView } from '../SafenetDetailsCard'
import { SAFENET_ATTESTATION_LINK_LABEL, SAFENET_EXPLORER_LINK_LABEL } from '../SafenetLinks'

jest.mock('@/hooks/useChains', () => ({
  useChain: jest.fn(),
}))

const mockUseChain = useChain as jest.MockedFunction<typeof useChain>

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

describe('SafenetDetailsCardView', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

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
    expect(screen.queryByText('Malicious threats detected')).not.toBeInTheDocument()
  })

  it('shows only the cited rules on a risk, most-cited first', () => {
    renderCard(CheckStatus.MALICIOUS, [vote(0, 'R-4.5'), vote(1, 'R-4.5'), vote(2, 'R-4.4')])

    expect(screen.getAllByText('Risk detected')).toHaveLength(1)
    expect(screen.queryByText('Malicious threats detected')).not.toBeInTheDocument()
    expect(screen.queryByText('What Safenet checked')).not.toBeInTheDocument()
    const body = screen.getByTestId('safenet-details-card').textContent ?? ''
    expect(body.indexOf('Unlimited approval')).toBeLessThan(body.indexOf('Unknown spender'))
    expect(screen.getByText('Flagged by 2 sentinels')).toBeInTheDocument()
    expect(screen.getByText('Flagged by 1 sentinel')).toBeInTheDocument()
    expect(screen.queryByText('Malicious threat detected')).not.toBeInTheDocument()
    expect(screen.getByTestId('safenet-details-explorer')).toHaveAccessibleName(SAFENET_EXPLORER_LINK_LABEL)
    expect(screen.queryByTestId('safenet-details-attestation')).not.toBeInTheDocument()
  })

  it('uses the rule itself when only one was cited', () => {
    renderCard(CheckStatus.MALICIOUS, [vote(0, 'R-4.6')])

    expect(screen.getAllByText('Risk detected')).toHaveLength(1)
    expect(screen.getByText('Malicious threat detected')).toBeInTheDocument()
    expect(screen.getByText(/known to be malicious or compromised/)).toBeInTheDocument()
    expect(screen.queryByText('Malicious threats detected')).not.toBeInTheDocument()
  })

  it('uses the PRD sentence when a risk cites no recognised rule', () => {
    renderCard(CheckStatus.MALICIOUS, [vote(0, 'R-9.9')])

    expect(screen.getAllByText('Risk detected')).toHaveLength(1)
    expect(screen.getByText('Safenet flagged this address/transaction as malicious')).toBeInTheDocument()
    expect(screen.queryByText('Malicious threats detected')).not.toBeInTheDocument()
  })

  it('states the PRD sentence for a clear result and does not list every rule', () => {
    renderCard(CheckStatus.BENIGN, [vote(0, null), vote(1, null)])

    expect(screen.getByText('Safenet found no issues')).toBeInTheDocument()
    expect(screen.queryByText(/sentinels approved/)).not.toBeInTheDocument()
    expect(screen.getByTestId('safenet-details-explorer')).toHaveAccessibleName(SAFENET_EXPLORER_LINK_LABEL)
  })

  it('links the signed attestation when FROST-verified', () => {
    const attested = attestedEvent({ safeTxHash: HASH })
    const snapshot = buildBenignSnapshot({
      safeTxHash: HASH,
      events: [attested],
      attestation: { status: AttestationVerificationStatus.VERIFIED, signatureId: attested.signatureId, message: null },
    })
    mockUseChain.mockReturnValue({
      blockExplorerUriTemplate: {
        txHash: 'https://gnosisscan.io/tx/{{txHash}}',
        address: 'https://gnosisscan.io/address/{{address}}',
        api: '',
      },
    } as Chain)

    render(
      <SafenetDetailsCardView
        publicStatus={CheckStatus.BENIGN}
        snapshot={snapshot}
        safeTxHash={HASH}
        chainId="1"
        defaultExpanded
      />,
    )

    expect(screen.getByTestId('safenet-details-attestation')).toHaveAccessibleName(SAFENET_ATTESTATION_LINK_LABEL)
    expect(screen.getByTestId('safenet-details-attestation')).toHaveAttribute(
      'href',
      `https://gnosisscan.io/tx/${attested.transactionHash}`,
    )
    expect(screen.queryByTestId('safenet-details-explorer')).not.toBeInTheDocument()
  })

  it('shows the simulating sentence and no link while the check runs', () => {
    renderCard(CheckStatus.IN_PROGRESS)

    expect(screen.getByText('Safenet is simulating this transaction.')).toBeInTheDocument()
    expect(screen.queryByText('Independent sentinels')).not.toBeInTheDocument()
    expect(screen.queryByText('What Safenet checks')).not.toBeInTheDocument()
    expect(screen.getByText(/come back to execute/)).toBeInTheDocument()
    expect(screen.queryByTestId('safenet-details-explorer')).not.toBeInTheDocument()
    expect(screen.queryByTestId('safenet-details-attestation')).not.toBeInTheDocument()
  })

  it('uses the unavailable sentence when the check failed and links the explorer', () => {
    renderCard(CheckStatus.TIMED_OUT, [vote(0, null), vote(1, 'R-4.3')])

    expect(screen.getByText('Safenet check is unavailable. You can still continue.')).toBeInTheDocument()
    expect(screen.queryByText('Unknown recipient')).not.toBeInTheDocument()
    expect(screen.getByTestId('safenet-details-explorer')).toHaveAccessibleName(SAFENET_EXPLORER_LINK_LABEL)
    expect(screen.queryByTestId('safenet-details-attestation')).not.toBeInTheDocument()
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
