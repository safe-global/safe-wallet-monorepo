import { render, screen } from '@/tests/test-utils'
import { useChain } from '@/hooks/useChains'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import {
  AttestationVerificationStatus,
  CheckStatus,
  SAFENET_EXPLORER_URL,
  type Hex,
  type OracleAttestedEvent,
  type SafenetCheckSnapshot,
} from '@safe-global/utils/features/safenet-checks'
import { useSafenetCheck } from '@safe-global/utils/features/safenet-checks/hooks'
import {
  attestedEvent,
  buildBenignSnapshot,
  buildCheckView,
  buildRequestSnapshot,
  buildSnapshot,
} from '@safe-global/utils/features/safenet-checks/builders'
import { formatAuditDateTime } from '@/components/common/AuditLog'
import { SafenetAuditRow } from '../SafenetAuditRow'

jest.mock('@safe-global/utils/features/safenet-checks/hooks', () => ({
  ...jest.requireActual('@safe-global/utils/features/safenet-checks/hooks'),
  useSafenetCheck: jest.fn(),
}))
jest.mock('@/hooks/useChains', () => ({
  useChain: jest.fn(),
}))

const mockUseSafenetCheck = useSafenetCheck as jest.MockedFunction<typeof useSafenetCheck>
const mockUseChain = useChain as jest.MockedFunction<typeof useChain>

const HASH = `0x${'ab'.repeat(32)}`
const SAFE_TX_HASH = HASH as Hex
const REQUEST_ID = `0x${'cd'.repeat(32)}` as Hex
const DENIED_REQUEST_ID = `0x${'ef'.repeat(32)}` as Hex
const SIGNATURE_ID = `0x${'12'.repeat(32)}` as Hex

const view = buildCheckView

type Approval = { attested?: OracleAttestedEvent | null; attestedAtMs?: number | null }

const benignSnapshot = ({
  attested = attestedEvent({ safeTxHash: SAFE_TX_HASH }),
  attestedAtMs = null,
}: Approval = {}): SafenetCheckSnapshot => {
  const attestation = {
    status: AttestationVerificationStatus.VERIFIED,
    signatureId: attested?.signatureId ?? SIGNATURE_ID,
    message: REQUEST_ID,
  }
  const request = buildRequestSnapshot({
    requestId: REQUEST_ID,
    state: 'RESOLVED_APPROVED',
    outcome: 'APPROVED',
    attestation,
    attestedEvent: attested,
    attestedAtMs,
  })
  return buildBenignSnapshot({
    safeTxHash: SAFE_TX_HASH,
    events: attested ? [attested] : [],
    requestId: REQUEST_ID,
    epoch: request.epoch,
    oracle: request.oracle,
    deadlineBlock: request.revealDeadlineBlock,
    attestation,
    attestedAtMs,
    requests: [request],
  })
}

describe('SafenetAuditRow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders nothing before the first snapshot (no phantom step per transaction)', () => {
    mockUseSafenetCheck.mockReturnValue(view({ isLoading: true }))

    const { container } = render(<SafenetAuditRow safeTxHash={HASH} chainId="100" />)

    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when no check was observed (UNAVAILABLE)', () => {
    const snapshot = buildSnapshot({ safeTxHash: SAFE_TX_HASH, status: CheckStatus.UNAVAILABLE })
    mockUseSafenetCheck.mockReturnValue(
      view({ snapshot, status: CheckStatus.UNAVAILABLE, publicStatus: CheckStatus.UNAVAILABLE }),
    )

    const { container } = render(<SafenetAuditRow safeTxHash={HASH} chainId="100" />)

    expect(container).toBeEmptyDOMElement()
  })

  it('renders a Simulating step by Safenet while the check is in flight', () => {
    const snapshot = buildSnapshot({ safeTxHash: SAFE_TX_HASH, status: CheckStatus.IN_PROGRESS })
    mockUseSafenetCheck.mockReturnValue(
      view({ snapshot, status: CheckStatus.IN_PROGRESS, publicStatus: CheckStatus.IN_PROGRESS }),
    )

    render(<SafenetAuditRow safeTxHash={HASH} chainId="100" />)

    expect(screen.getByText('Simulating')).toBeInTheDocument()
    expect(screen.getByText('By Safenet')).toBeInTheDocument()
    expect(screen.queryByTestId('safenet-attestation-link')).not.toBeInTheDocument()
    expect(screen.queryByText(/2026/)).not.toBeInTheDocument()
  })

  it('links the attestation transaction on the Safenet chain block explorer once FROST-verified', () => {
    const attested = attestedEvent({ safeTxHash: SAFE_TX_HASH })
    const snapshot = benignSnapshot({ attested })
    mockUseSafenetCheck.mockReturnValue(
      view({ snapshot, status: CheckStatus.BENIGN, publicStatus: CheckStatus.BENIGN }),
    )
    mockUseChain.mockReturnValue({
      blockExplorerUriTemplate: {
        txHash: 'https://gnosisscan.io/tx/{{txHash}}',
        address: 'https://gnosisscan.io/address/{{address}}',
        api: '',
      },
    } as Chain)

    render(<SafenetAuditRow safeTxHash={HASH} chainId="1" />)

    expect(screen.getByText('No issues found')).toBeInTheDocument()
    // "By Safenet" with "Safenet" as the link — the actor line IS the proof link.
    expect(screen.getByText(/^By/)).toBeInTheDocument()
    expect(screen.getByTestId('safenet-attestation-link')).toHaveTextContent('Safenet')
    expect(screen.getByTestId('safenet-attestation-link')).toHaveAttribute(
      'href',
      `https://gnosisscan.io/tx/${attested.transactionHash}`,
    )
  })

  it('falls back to the Safenet explorer hash route when the chain config is unknown', () => {
    const snapshot = benignSnapshot()
    mockUseSafenetCheck.mockReturnValue(
      view({ snapshot, status: CheckStatus.BENIGN, publicStatus: CheckStatus.BENIGN }),
    )
    mockUseChain.mockReturnValue(undefined)

    render(<SafenetAuditRow safeTxHash={HASH} chainId="1" />)

    expect(screen.getByTestId('safenet-attestation-link')).toHaveAttribute(
      'href',
      `${SAFENET_EXPLORER_URL}/#/safeTx?chainId=1&safeTxHash=${HASH}`,
    )
  })

  it('dates the No-issues step from the attested block', () => {
    // 2026-08-03T09:39:45Z — the block the attestation landed in, not read time.
    const snapshot = benignSnapshot({ attestedAtMs: 1_785_749_985_000 })
    mockUseSafenetCheck.mockReturnValue(
      view({ snapshot, status: CheckStatus.BENIGN, publicStatus: CheckStatus.BENIGN }),
    )

    render(<SafenetAuditRow safeTxHash={HASH} chainId="1" />)

    expect(screen.getByText(formatAuditDateTime(1_785_749_985_000))).toBeInTheDocument()
  })

  it('renders No issues found without a date when the attested header could not be read', () => {
    const snapshot = benignSnapshot({ attestedAtMs: null })
    mockUseSafenetCheck.mockReturnValue(
      view({ snapshot, status: CheckStatus.BENIGN, publicStatus: CheckStatus.BENIGN }),
    )

    render(<SafenetAuditRow safeTxHash={HASH} chainId="1" />)

    expect(screen.getByText('No issues found')).toBeInTheDocument()
    expect(screen.queryByText(/2026/)).not.toBeInTheDocument()
  })

  it('renders No issues found without a proof link when no attested log backs the verdict', () => {
    // Getter-only evidence (the attested log fell outside the read window) has no transaction to point at.
    const snapshot = benignSnapshot({ attested: null })
    mockUseSafenetCheck.mockReturnValue(
      view({ snapshot, status: CheckStatus.BENIGN, publicStatus: CheckStatus.BENIGN }),
    )

    render(<SafenetAuditRow safeTxHash={HASH} chainId="1" />)

    expect(screen.getByText('No issues found')).toBeInTheDocument()
    expect(screen.queryByTestId('safenet-attestation-link')).not.toBeInTheDocument()
  })

  it.each([
    ['alone', false],
    ['beside a verified approval of the same hash', true],
  ])('renders Risk detected without a link when MALICIOUS (%s)', (_name, withVerifiedSibling) => {
    const denied = buildRequestSnapshot({
      requestId: DENIED_REQUEST_ID,
      state: 'RESOLVED_DENIED',
      outcome: 'DENIED',
      committedCount: 2,
      revealedCount: 2,
      denyCount: 2,
    })
    const snapshot = buildSnapshot({
      safeTxHash: SAFE_TX_HASH,
      status: CheckStatus.MALICIOUS,
      outcome: 'DENIED',
      requestId: denied.requestId,
      epoch: denied.epoch,
      oracle: denied.oracle,
      deadlineBlock: denied.revealDeadlineBlock,
      requests: withVerifiedSibling ? [...benignSnapshot().requests, denied] : [denied],
      evidenceComplete: true,
    })
    mockUseSafenetCheck.mockReturnValue(
      view({ snapshot, status: CheckStatus.MALICIOUS, publicStatus: CheckStatus.MALICIOUS }),
    )

    render(<SafenetAuditRow safeTxHash={HASH} chainId="100" />)

    expect(screen.getByText('Risk detected')).toBeInTheDocument()
    expect(screen.queryByTestId('safenet-attestation-link')).not.toBeInTheDocument()
  })
})
