import type { ComponentProps } from 'react'
import { faker } from '@faker-js/faker'
import { render, screen } from '@/tests/test-utils'
import { useChain } from '@/hooks/useChains'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { AttestationVerificationStatus, CheckStatus, type Hex } from '@safe-global/utils/features/safenet-checks'
import { useSafenetCheck } from '@safe-global/utils/features/safenet-checks/hooks'
import {
  attestedEvent,
  buildBenignSnapshot,
  buildCheckView,
  buildSnapshot,
  oracleResultEvent,
  sentinelRevealedEvent,
} from '@safe-global/utils/features/safenet-checks/builders'
import SafenetDetailsCard, { SafenetDetailsCardView, SafenetUnavailableCardView } from '../SafenetDetailsCard'
import { SAFENET_ATTESTATION_LINK_LABEL, SAFENET_EXPLORER_LINK_LABEL } from '../SafenetLinks'
import { getSafenetExplorerUrl } from '../../statusPresentation'

jest.mock('@/hooks/useChains', () => ({ useChain: jest.fn() }))
jest.mock('@safe-global/utils/features/safenet-checks/hooks', () => ({
  ...jest.requireActual('@safe-global/utils/features/safenet-checks/hooks'),
  useSafenetCheck: jest.fn(),
}))

const safeTxHash = faker.string.hexadecimal({ length: 64, prefix: '0x', casing: 'lower' }) as Hex
const chainId = faker.string.numeric(3)

const renderView = (
  props: Pick<ComponentProps<typeof SafenetDetailsCardView>, 'publicStatus' | 'snapshot'>,
  defaultExpanded = true,
) =>
  render(
    <SafenetDetailsCardView {...props} safeTxHash={safeTxHash} chainId={chainId} defaultExpanded={defaultExpanded} />,
  )

describe('SafenetDetailsCardView', () => {
  it('shows the state on the collapsed header', () => {
    const snapshot = buildSnapshot({ safeTxHash, status: CheckStatus.MALICIOUS })

    renderView({ publicStatus: CheckStatus.MALICIOUS, snapshot }, false)

    expect(screen.getByTestId('safenet-details-card')).toHaveAttribute('data-status', CheckStatus.MALICIOUS)
    expect(screen.getByText('Risk detected')).toBeInTheDocument()
  })

  it('lists the cited rules on a risk, most-cited first', () => {
    const events = ['R-4.5', 'R-4.5', 'R-4.4'].map((reason) => sentinelRevealedEvent({ approved: false, reason }))

    renderView({
      publicStatus: CheckStatus.MALICIOUS,
      snapshot: buildSnapshot({ safeTxHash, status: CheckStatus.MALICIOUS, events }),
    })

    const body = screen.getByTestId('safenet-details-card').textContent ?? ''
    expect(body.indexOf('Unlimited approval')).toBeLessThan(body.indexOf('Unknown spender'))
    expect(screen.getByText('Flagged by 2 sentinels')).toBeInTheDocument()
    expect(screen.getByText('Flagged by 1 sentinel')).toBeInTheDocument()
  })

  it('links the attestation for a verified no-issues result', () => {
    const attested = attestedEvent({ safeTxHash })
    const attestation = {
      status: AttestationVerificationStatus.VERIFIED,
      signatureId: attested.signatureId,
      message: null,
    }
    jest.mocked(useChain).mockReturnValue({
      blockExplorerUriTemplate: { txHash: 'https://gnosisscan.io/tx/{{txHash}}', address: '', api: '' },
    } as Chain)

    renderView({
      publicStatus: CheckStatus.BENIGN,
      snapshot: buildBenignSnapshot({ safeTxHash, events: [attested], attestation }),
    })

    const link = screen.getByTestId('safenet-details-attestation')
    expect(link).toHaveAccessibleName(SAFENET_ATTESTATION_LINK_LABEL)
    expect(link).toHaveAttribute('href', `https://gnosisscan.io/tx/${attested.transactionHash}`)
  })

  it('shows no link while the check is in flight', () => {
    renderView({
      publicStatus: CheckStatus.IN_PROGRESS,
      snapshot: buildSnapshot({ safeTxHash, status: CheckStatus.IN_PROGRESS }),
    })

    expect(screen.getByText('Safenet is simulating this transaction.')).toBeInTheDocument()
    expect(screen.queryByTestId('safenet-details-explorer')).not.toBeInTheDocument()
    expect(screen.queryByTestId('safenet-details-attestation')).not.toBeInTheDocument()
  })

  it('says why a check failed', () => {
    renderView({
      publicStatus: CheckStatus.TIMED_OUT,
      snapshot: buildSnapshot({ safeTxHash, status: CheckStatus.TIMED_OUT, events: [oracleResultEvent()] }),
    })

    expect(screen.getByTestId('safenet-failure-reason')).toHaveTextContent(
      'Sentinels voted, but the validators did not sign the result in time.',
    )
  })
})

describe('SafenetUnavailableCardView', () => {
  it('links the Safenet explorer page of the transaction', () => {
    render(
      <SafenetUnavailableCardView reason="READ_FAILED" safeTxHash={safeTxHash} chainId={chainId} defaultExpanded />,
    )

    const link = screen.getByTestId('safenet-details-explorer')
    expect(link).toHaveAccessibleName(SAFENET_EXPLORER_LINK_LABEL)
    expect(link).toHaveAttribute('href', getSafenetExplorerUrl(chainId, safeTxHash))
  })
})

describe('SafenetDetailsCard', () => {
  it('renders nothing when no check was observed', () => {
    jest.mocked(useSafenetCheck).mockReturnValue(buildCheckView())

    const { container } = render(<SafenetDetailsCard safeTxHash={safeTxHash} chainId={chainId} />)

    expect(container).toBeEmptyDOMElement()
  })

  it.each([
    ['NO_CHECK', 'proven'],
    ['WINDOW_UNCERTAIN', 'heuristic'],
  ] as const)('renders nothing when the read found no check: %s', (unavailableReason, windowCoverage) => {
    const snapshot = buildSnapshot({ safeTxHash, status: CheckStatus.UNAVAILABLE, windowCoverage })
    jest.mocked(useSafenetCheck).mockReturnValue(buildCheckView({ snapshot, unavailableReason }))

    const { container } = render(<SafenetDetailsCard safeTxHash={safeTxHash} chainId={chainId} />)

    expect(container).toBeEmptyDOMElement()
  })

  it("shows a neutral card when Safenet's status could not be read", () => {
    jest.mocked(useSafenetCheck).mockReturnValue(buildCheckView({ unavailableReason: 'READ_FAILED' }))

    render(<SafenetDetailsCard safeTxHash={safeTxHash} chainId={chainId} />)

    expect(screen.getByTestId('safenet-details-card')).toHaveAttribute('data-status', CheckStatus.UNAVAILABLE)
    expect(screen.getByText("Couldn't read Safenet status")).toBeInTheDocument()
  })

  it('shows the card once a check is read', () => {
    const snapshot = buildBenignSnapshot({ safeTxHash })
    jest
      .mocked(useSafenetCheck)
      .mockReturnValue(buildCheckView({ snapshot, status: CheckStatus.BENIGN, publicStatus: CheckStatus.BENIGN }))

    render(<SafenetDetailsCard safeTxHash={safeTxHash} chainId={chainId} />)

    expect(screen.getByTestId('safenet-details-card')).toHaveAttribute('data-status', CheckStatus.BENIGN)
  })
})
